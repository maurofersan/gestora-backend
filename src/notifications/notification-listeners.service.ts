import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { NotificationType } from '../common/enums/notification-type.enum';
import { UserType } from '../common/enums/user-type.enum';
import type { ActivityDocument } from '../activities/schemas/activity.schema';
import type { DutyDocument } from '../duties/schemas/duty.schema';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationDispatchService } from './notification-dispatch.service';

function excludeActor(userIds: Types.ObjectId[], actorId: Types.ObjectId): Types.ObjectId[] {
  const actorKey = actorId.toString();
  return userIds.filter((id) => id != null && id.toString() !== actorKey);
}

@Injectable()
export class ActivityNotificationListener {
  private readonly logger = new Logger(ActivityNotificationListener.name);

  constructor(
    private readonly audience: NotificationAudienceService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  onActivityUpdated(
    activity: ActivityDocument,
    context: {
      previousStatus: ActivityWorkflowStatus;
      previousStatusColor: ActivityStatusColor;
      actorId: Types.ObjectId;
    },
  ): void {
    const projectId = activity.projectId;
    const activityId = activity._id;
    const label = `${activity.code}: ${activity.description}`;

    if (
      context.previousStatus !== ActivityWorkflowStatus.DONE &&
      activity.status === ActivityWorkflowStatus.DONE
    ) {
      void this.audience
        .allUsersOnProject(projectId, { excludeUserIds: [context.actorId] })
        .then((recipients) => {
          this.dispatch.dispatchAsync({
            projectId,
            toUserIds: recipients,
            type: NotificationType.ACTIVITY_COMPLETED,
            title: 'Actividad culminada',
            body: label,
            data: { activityId },
            dedupeKeyBase: `activity_completed:${activityId.toString()}`,
          });
        })
        .catch((error) => {
          this.logger.error(
            'activity_completed listener failed',
            error instanceof Error ? error.stack : error,
          );
        });
      return;
    }

    if (
      activity.status !== ActivityWorkflowStatus.DONE &&
      context.previousStatusColor !== ActivityStatusColor.RED &&
      activity.statusColor === ActivityStatusColor.RED
    ) {
      void this.audience
        .companyUsersExcludingClient(projectId, { excludeUserIds: [context.actorId] })
        .then((recipients) => {
          this.dispatch.dispatchAsync({
            projectId,
            toUserIds: recipients,
            type: NotificationType.ACTIVITY_OVERDUE,
            title: 'Actividad atrasada',
            body: label,
            data: { activityId },
            dedupeKeyBase: `activity_overdue:${activityId.toString()}`,
          });
        })
        .catch((error) => {
          this.logger.error(
            'activity_overdue listener failed',
            error instanceof Error ? error.stack : error,
          );
        });
    }
  }
}

@Injectable()
export class DutyNotificationListener {
  private readonly logger = new Logger(DutyNotificationListener.name);

  constructor(
    private readonly audience: NotificationAudienceService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  async onDutyCreated(
    duty: DutyDocument,
    actor: { _id: Types.ObjectId; type: UserType },
  ): Promise<void> {
    const projectId = duty.projectId;
    const body =
      duty.description.length > 120 ? `${duty.description.slice(0, 117)}…` : duty.description;

    let recipients: Types.ObjectId[] = [];

    if (actor.type === UserType.CLIENT) {
      const planners = await this.audience.planificadoresOnProject(projectId);
      const company = await this.audience.companyUsersOnProject(projectId, {
        excludeUserIds: [actor._id],
      });
      recipients = [...planners, ...company];
    } else {
      const clientId = await this.audience.clientUserId(projectId);
      const company = await this.audience.companyUsersOnProject(projectId, {
        excludeUserIds: [actor._id],
      });
      recipients = clientId ? [clientId, ...company] : company;
    }

    const uniqueRecipients = [...new Set(recipients.map((id) => id.toString()))].map(
      (id) => new Types.ObjectId(id),
    );

    if (uniqueRecipients.length === 0) {
      this.logger.warn(
        `duty_created: no recipients for project ${projectId.toString()} (actor ${actor._id.toString()})`,
      );
      return;
    }

    this.dispatch.dispatchAsync({
      projectId,
      toUserIds: uniqueRecipients,
      type: NotificationType.DUTY_CREATED,
      title: 'Nueva urgencia',
      body,
      data: { dutyId: duty._id },
    });
  }

  async onDutyUpdated(
    duty: DutyDocument,
    actorId: Types.ObjectId,
    previousStatus: string,
  ): Promise<void> {
    if (duty.status === previousStatus) return;

    const projectId = duty.projectId;
    const body =
      duty.description.length > 120 ? `${duty.description.slice(0, 117)}…` : duty.description;
    const statusLabel = duty.status === 'resolved' ? 'resuelta' : 'pendiente';

    const planners = await this.audience.planificadoresOnProject(projectId);
    const clientId = await this.audience.clientUserId(projectId);
    const recipients = excludeActor(
      [...planners, ...(clientId ? [clientId] : []), duty.createdByUserId],
      actorId,
    );

    const uniqueRecipients = [...new Set(recipients.map((id) => id.toString()))].map(
      (id) => new Types.ObjectId(id),
    );

    if (uniqueRecipients.length === 0) {
      this.logger.warn(
        `duty_updated: no recipients for project ${projectId.toString()} (actor ${actorId.toString()})`,
      );
      return;
    }

    this.dispatch.dispatchAsync({
      projectId,
      toUserIds: uniqueRecipients,
      type: NotificationType.DUTY_UPDATED,
      title: `Urgencia ${statusLabel}`,
      body,
      data: { dutyId: duty._id },
    });
  }
}

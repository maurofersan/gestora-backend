import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';
import { NotificationType } from '../common/enums/notification-type.enum';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class ActivityNotificationSchedulerService {
  private readonly logger = new Logger(ActivityNotificationSchedulerService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly audience: NotificationAudienceService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async scanActivityAlerts(): Promise<void> {
    if (this.configService.get<string>('NOTIFICATION_CRON_ENABLED') === 'false') {
      return;
    }

    this.logger.log('Scanning activity notification alerts…');
    const dueSoonHours = Number(this.configService.get('NOTIFICATION_DUE_SOON_HOURS') ?? 48);
    const now = new Date();

    const pendingActivities = await this.activityModel
      .find({ status: ActivityWorkflowStatus.PENDING })
      .select('_id projectId code description planned.end statusColor')
      .lean()
      .exec();

    const projects = await this.projectModel.find().select('_id timezone').lean().exec();
    const tzByProject = new Map(projects.map((p) => [p._id.toString(), p.timezone ?? 'UTC']));

    for (const activity of pendingActivities) {
      const plannedEnd = new Date(activity.planned.end);
      const tz = tzByProject.get(activity.projectId.toString()) ?? 'UTC';
      const endLabel = DateTime.fromJSDate(plannedEnd, { zone: 'utc' })
        .setZone(tz)
        .toFormat('dd/MM/yyyy');

      const msUntilEnd = plannedEnd.getTime() - now.getTime();
      const isOverdue =
        activity.statusColor === ActivityStatusColor.RED || plannedEnd.getTime() < now.getTime();
      const isDueSoon = !isOverdue && msUntilEnd > 0 && msUntilEnd <= dueSoonHours * 3600 * 1000;

      if (isOverdue) {
        const recipients = await this.audience.companyUsersExcludingClient(activity.projectId);
        this.dispatch.dispatchAsync({
          projectId: activity.projectId,
          toUserIds: recipients,
          type: NotificationType.ACTIVITY_OVERDUE,
          title: 'Actividad atrasada',
          body: `${activity.code}: ${activity.description} (fin planificado ${endLabel})`,
          data: { activityId: activity._id },
          dedupeKeyBase: `activity_overdue:${activity._id.toString()}`,
        });
      } else if (isDueSoon) {
        const recipients = await this.audience.companyUsersExcludingClient(activity.projectId);
        this.dispatch.dispatchAsync({
          projectId: activity.projectId,
          toUserIds: recipients,
          type: NotificationType.ACTIVITY_DUE_SOON,
          title: 'Actividad por terminar',
          body: `${activity.code}: ${activity.description} (fin planificado ${endLabel})`,
          data: { activityId: activity._id },
          dedupeKeyBase: `activity_due_soon:${activity._id.toString()}`,
        });
      }
    }
  }
}

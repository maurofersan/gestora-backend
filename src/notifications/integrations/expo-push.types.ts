import type { NotificationType } from '../../common/enums/notification-type.enum';

export type NotificationPushData = {
  type: NotificationType;
  projectId: string;
  notificationId: string;
  activityId?: string;
  dutyId?: string;
};

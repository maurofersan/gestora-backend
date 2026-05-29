import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { PushDevice, PushDeviceSchema } from './schemas/push-device.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { NotificationsService } from './notifications.service';
import { NotificationsController, PushTokenController } from './notifications.controller';
import { ExpoPushService } from './integrations/expo-push.service';
import { PushDeviceService } from './push-device.service';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import {
  ActivityNotificationListener,
  DutyNotificationListener,
} from './notification-listeners.service';
import { ActivityNotificationSchedulerService } from './activity-notification.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: PushDevice.name, schema: PushDeviceSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [NotificationsController, PushTokenController],
  providers: [
    NotificationsService,
    ExpoPushService,
    PushDeviceService,
    NotificationAudienceService,
    NotificationDispatchService,
    ActivityNotificationListener,
    DutyNotificationListener,
    ActivityNotificationSchedulerService,
  ],
  exports: [
    NotificationsService,
    NotificationDispatchService,
    ActivityNotificationListener,
    DutyNotificationListener,
    MongooseModule,
  ],
})
export class NotificationsModule {}

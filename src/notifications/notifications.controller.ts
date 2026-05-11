import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { NotificationsService } from './notifications.service';
import { Types } from 'mongoose';

@ApiTags('Notifications')
@ApiBearerJwt()
@Controller('me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listMine(user._id);
  }

  @Patch(':notificationId/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('notificationId') notificationId: string) {
    return this.notificationsService.markRead(user._id, new Types.ObjectId(notificationId));
  }
}

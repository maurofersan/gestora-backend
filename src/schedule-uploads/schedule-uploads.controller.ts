import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ScheduleUploadsService } from './schedule-uploads.service';
import { CreateScheduleUploadDto } from './dto/create-schedule-upload.dto';
import { Types } from 'mongoose';

@ApiTags('Schedule uploads')
@ApiBearerJwt()
@Controller('projects/:projectId/schedule-uploads')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ScheduleUploadsController {
  constructor(private readonly scheduleUploadsService: ScheduleUploadsService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.scheduleUploadsService.list(new Types.ObjectId(projectId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateScheduleUploadDto,
  ) {
    return this.scheduleUploadsService.create(
      user._id,
      new Types.ObjectId(projectId),
      dto,
    );
  }
}

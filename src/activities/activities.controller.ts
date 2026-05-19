import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { AddRestrictionDto } from './dto/add-restriction.dto';
import { PatchNonComplianceDto } from './dto/patch-non-compliance.dto';
import { CreateNonComplianceEventDto } from './dto/create-non-compliance-event.dto';
import { Types } from 'mongoose';

@ApiTags('Activities')
@ApiBearerJwt()
@Controller('projects/:projectId/activities')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @Query() query: ListActivitiesQueryDto,
  ) {
    return this.activitiesService.list(new Types.ObjectId(projectId), query);
  }

  @Get(':activityId/non-compliance-events')
  listNonComplianceEvents(
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.activitiesService.listNonComplianceEvents(
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
    );
  }

  @Get(':activityId/non-compliance-events/:eventId')
  getNonComplianceEvent(
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.activitiesService.getNonComplianceEvent(
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      new Types.ObjectId(eventId),
    );
  }

  @Get(':activityId')
  one(@Param('projectId') projectId: string, @Param('activityId') activityId: string) {
    return this.activitiesService.get(
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user, new Types.ObjectId(projectId), dto);
  }

  @Post(':activityId/non-compliance-events')
  createNonComplianceEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Body() dto: CreateNonComplianceEventDto,
  ) {
    return this.activitiesService.createNonComplianceEvent(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      dto,
    );
  }

  @Patch(':activityId/non-compliance-events/:eventId')
  patchNonComplianceEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Param('eventId') eventId: string,
    @Body() dto: PatchNonComplianceDto,
  ) {
    return this.activitiesService.patchNonComplianceEvent(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      new Types.ObjectId(eventId),
      dto,
    );
  }

  @Patch(':activityId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      dto,
    );
  }

  @Post(':activityId/restrictions')
  addRestriction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Body() dto: AddRestrictionDto,
  ) {
    return this.activitiesService.addRestriction(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      dto,
    );
  }

  /** @deprecated Preferir PATCH .../non-compliance-events/:eventId */
  @Patch(':activityId/non-compliance')
  patchNonCompliance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Body() dto: PatchNonComplianceDto,
  ) {
    return this.activitiesService.patchNonCompliance(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      dto,
    );
  }
}

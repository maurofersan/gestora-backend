import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MeetingListItemDto } from './dto/meeting-list-item.dto';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Types } from 'mongoose';

const EMPRESA_VER_COMPROMISOS = [
  UserRole.ULTIMO_PLANIFICADOR,
  UserRole.GERENTE,
  UserRole.RESIDENTE,
  UserRole.ESPECIALISTA,
];

@ApiTags('Meetings')
@ApiBearerJwt()
@Controller('projects/:projectId/meeting-areas/:areaId/meetings')
@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @Roles(...EMPRESA_VER_COMPROMISOS)
  @ApiOkResponse({ type: MeetingListItemDto, isArray: true })
  list(@Param('projectId') projectId: string, @Param('areaId') areaId: string) {
    return this.meetingsService.list(new Types.ObjectId(projectId), new Types.ObjectId(areaId));
  }

  @Post()
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('areaId') areaId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.create(
      user._id,
      new Types.ObjectId(projectId),
      new Types.ObjectId(areaId),
      dto,
    );
  }
}

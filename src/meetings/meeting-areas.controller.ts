import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { MeetingAreasService } from './meeting-areas.service';
import { CreateMeetingAreaDto } from './dto/create-meeting-area.dto';
import { Types } from 'mongoose';

const EMPRESA_VER_COMPROMISOS = [
  UserRole.ULTIMO_PLANIFICADOR,
  UserRole.GERENTE,
  UserRole.RESIDENTE,
  UserRole.ESPECIALISTA,
];

@ApiTags('Meeting areas')
@ApiBearerJwt()
@Controller('projects/:projectId/meeting-areas')
@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
export class MeetingAreasController {
  constructor(private readonly meetingAreasService: MeetingAreasService) {}

  @Get()
  @Roles(...EMPRESA_VER_COMPROMISOS)
  list(@Param('projectId') projectId: string) {
    return this.meetingAreasService.list(new Types.ObjectId(projectId));
  }

  @Post()
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(@Param('projectId') projectId: string, @Body() dto: CreateMeetingAreaDto) {
    return this.meetingAreasService.create(new Types.ObjectId(projectId), dto);
  }
}

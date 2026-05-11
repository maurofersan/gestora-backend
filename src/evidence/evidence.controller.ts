import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { Types } from 'mongoose';

@ApiTags('Evidence')
@ApiBearerJwt()
@Controller('projects/:projectId/activities/:activityId/evidence')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get()
  list(@Param('projectId') projectId: string, @Param('activityId') activityId: string) {
    return this.evidenceService.list(
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Body() dto: CreateEvidenceDto,
  ) {
    return this.evidenceService.create(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      dto,
    );
  }
}

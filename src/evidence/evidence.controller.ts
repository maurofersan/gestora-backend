import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @Delete(':evidenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar evidencia (MongoDB + Cloudinary, best-effort)' })
  @ApiNoContentResponse({ description: 'Evidencia eliminada' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('activityId') activityId: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    return this.evidenceService.remove(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(activityId),
      new Types.ObjectId(evidenceId),
    );
  }
}

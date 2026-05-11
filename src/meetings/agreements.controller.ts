import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { PatchAgreementDto } from './dto/patch-agreement.dto';
import { Types } from 'mongoose';

const EMPRESA_VER_COMPROMISOS = [
  UserRole.ULTIMO_PLANIFICADOR,
  UserRole.GERENTE,
  UserRole.RESIDENTE,
  UserRole.ESPECIALISTA,
];

@ApiTags('Agreements')
@ApiBearerJwt()
@Controller('projects/:projectId/meetings/:meetingId/agreements')
@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get()
  @Roles(...EMPRESA_VER_COMPROMISOS)
  list(@Param('projectId') projectId: string, @Param('meetingId') meetingId: string) {
    return this.agreementsService.list(
      new Types.ObjectId(projectId),
      new Types.ObjectId(meetingId),
    );
  }

  @Post()
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('meetingId') meetingId: string,
    @Body() dto: CreateAgreementDto,
  ) {
    return this.agreementsService.create(
      user._id,
      new Types.ObjectId(projectId),
      new Types.ObjectId(meetingId),
      dto,
    );
  }
}

@ApiTags('Agreements')
@ApiBearerJwt()
@Controller('projects/:projectId/agreements')
@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
export class AgreementPatchController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Patch(':agreementId')
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('agreementId') agreementId: string,
    @Body() dto: PatchAgreementDto,
  ) {
    return this.agreementsService.patch(
      user._id,
      new Types.ObjectId(projectId),
      new Types.ObjectId(agreementId),
      dto,
    );
  }
}

import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { LookaheadService } from './lookahead.service';
import { PutLookaheadDto } from './dto/put-lookahead.dto';
import { LookaheadQueryDto } from './dto/lookahead-query.dto';
import { Types } from 'mongoose';

@ApiTags('Lookahead')
@ApiBearerJwt()
@Controller('projects/:projectId/lookahead')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class LookaheadController {
  constructor(private readonly lookaheadService: LookaheadService) {}

  @Get()
  get(@Param('projectId') projectId: string, @Query() query: LookaheadQueryDto) {
    return this.lookaheadService.get(new Types.ObjectId(projectId), query.weekAnchor);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR, UserRole.ESPECIALISTA)
  put(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: PutLookaheadDto,
  ) {
    return this.lookaheadService.put(user._id, new Types.ObjectId(projectId), dto);
  }
}

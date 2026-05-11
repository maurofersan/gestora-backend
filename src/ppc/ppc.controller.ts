import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PpcService } from './ppc.service';
import { RegeneratePpcDto } from './dto/regenerate-ppc.dto';
import { PpcSnapshotQueryDto } from './dto/ppc-snapshot-query.dto';
import { Types } from 'mongoose';
import { getWeekRangeMondaySunday } from '../common/utils/week-range.util';

@ApiTags('PPC')
@ApiBearerJwt()
@Controller('projects/:projectId/ppc')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class PpcController {
  constructor(private readonly ppcService: PpcService) {}

  @Get('weeks')
  listWeeks(
    @Param('projectId') projectId: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.ppcService.listWeeks(
      new Types.ObjectId(projectId),
      specialtyId ? new Types.ObjectId(specialtyId) : undefined,
    );
  }

  @Get()
  snapshot(@Param('projectId') projectId: string, @Query() query: PpcSnapshotQueryDto) {
    const { weekStart } = getWeekRangeMondaySunday(new Date(query.weekAnchor));
    return this.ppcService.getSnapshot(
      new Types.ObjectId(projectId),
      new Types.ObjectId(query.specialtyId),
      weekStart,
    );
  }

  @Post('regenerate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  regenerate(@Param('projectId') projectId: string, @Body() dto: RegeneratePpcDto) {
    return this.ppcService.regenerate(new Types.ObjectId(projectId), dto);
  }
}

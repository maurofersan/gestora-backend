import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PpcService } from './ppc.service';
import { RegeneratePpcDto } from './dto/regenerate-ppc.dto';
import { PpcSnapshotQueryDto } from './dto/ppc-snapshot-query.dto';
import { PpcSnapshotResponseDto } from './dto/ppc-snapshot-response.dto';
import { Types } from 'mongoose';

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
  @ApiOkResponse({ type: PpcSnapshotResponseDto })
  snapshot(@Param('projectId') projectId: string, @Query() query: PpcSnapshotQueryDto) {
    return this.ppcService.getSnapshot(
      new Types.ObjectId(projectId),
      new Types.ObjectId(query.specialtyId),
      query.weekAnchor,
    );
  }

  @Post('regenerate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  @ApiOkResponse({ type: PpcSnapshotResponseDto })
  regenerate(@Param('projectId') projectId: string, @Body() dto: RegeneratePpcDto) {
    return this.ppcService.regenerate(new Types.ObjectId(projectId), dto);
  }
}

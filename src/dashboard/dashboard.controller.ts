import { Body, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { DashboardService } from './dashboard.service';
import { Types } from 'mongoose';
import { ProgressChartQueryDto } from './dto/progress-chart-query.dto';
import { ProgressChartResponseDto } from './dto/progress-chart-response.dto';

@ApiTags('Dashboard')
@ApiBearerJwt()
@Controller('projects/:projectId/dashboard')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@Param('projectId') projectId: string) {
    return this.dashboardService.summary(new Types.ObjectId(projectId));
  }

  @Get('progress-chart')
  @ApiOkResponse({ type: ProgressChartResponseDto })
  progressChart(
    @Param('projectId') projectId: string,
    @Query() query: ProgressChartQueryDto,
  ) {
    return this.dashboardService.progressChart(
      new Types.ObjectId(projectId),
      query.specialtyId ? new Types.ObjectId(query.specialtyId) : undefined,
    );
  }

  @Get('ranking-fallas')
  ranking(@Param('projectId') projectId: string) {
    return this.dashboardService.rankingFallas(new Types.ObjectId(projectId));
  }
}

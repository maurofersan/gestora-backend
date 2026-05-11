import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { DutiesService } from './duties.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateDutyDto } from './dto/create-duty.dto';
import { UpdateDutyDto } from './dto/update-duty.dto';
import { Types } from 'mongoose';

@ApiTags('Duties (urgencias)')
@ApiBearerJwt()
@Controller('projects/:projectId/duties')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class DutiesController {
  constructor(private readonly dutiesService: DutiesService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.dutiesService.list(new Types.ObjectId(projectId));
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateDutyDto,
  ) {
    return this.dutiesService.create(user, new Types.ObjectId(projectId), dto);
  }

  @Patch(':dutyId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('dutyId') dutyId: string,
    @Body() dto: UpdateDutyDto,
  ) {
    return this.dutiesService.update(
      user,
      new Types.ObjectId(projectId),
      new Types.ObjectId(dutyId),
      dto,
    );
  }
}

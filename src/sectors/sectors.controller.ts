import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { SectorsService } from './sectors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateSectorDto } from './dto/create-sector.dto';
import { Types } from 'mongoose';

@ApiTags('Sectors')
@ApiBearerJwt()
@Controller('projects/:projectId/sectors')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.sectorsService.list(new Types.ObjectId(projectId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(@Param('projectId') projectId: string, @Body() dto: CreateSectorDto) {
    return this.sectorsService.create(new Types.ObjectId(projectId), dto);
  }
}

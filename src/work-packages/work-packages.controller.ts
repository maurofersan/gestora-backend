import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { WorkPackagesService } from './work-packages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { Types } from 'mongoose';

@ApiTags('Work packages')
@ApiBearerJwt()
@Controller('projects/:projectId/work-packages')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class WorkPackagesController {
  constructor(private readonly workPackagesService: WorkPackagesService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.workPackagesService.list(new Types.ObjectId(projectId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateWorkPackageDto,
  ) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa');
    return this.workPackagesService.create(
      new Types.ObjectId(projectId),
      user.companyId,
      dto,
    );
  }
}

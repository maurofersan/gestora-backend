import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { Types } from 'mongoose';

@ApiTags('Users')
@ApiBearerJwt()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.createByPlanner(actor, dto);
  }

  @Get('by-project/:projectId')
  @UseGuards(ProjectAccessGuard, RolesGuard)
  @Roles(
    UserRole.ULTIMO_PLANIFICADOR,
    UserRole.GERENTE,
    UserRole.RESIDENTE,
    UserRole.ESPECIALISTA,
  )
  listByProject(@Param('projectId') projectId: string) {
    return this.usersService.listByProject(new Types.ObjectId(projectId));
  }
}

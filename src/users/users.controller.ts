import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { UsersService } from './users.service';
import { UsersPasswordService } from './users-password.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { SkipMustChangePassword } from '../common/decorators/skip-must-change-password.decorator';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto/change-password.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { Types } from 'mongoose';

@ApiTags('Users')
@ApiBearerJwt()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersPasswordService: UsersPasswordService,
  ) {}

  @Get('me')
  @SkipMustChangePassword()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Patch('me/password')
  @SkipMustChangePassword()
  @ApiOperation({
    summary: 'Cambiar contraseña propia',
    description: 'Obligatorio tras login con contraseña temporal (mustChangePassword).',
  })
  @ApiResponse({ status: 200, type: ChangePasswordResponseDto })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const updated = await this.usersPasswordService.changeOwnPassword(user, dto);
    return {
      message: 'Contraseña actualizada',
      user: updated as unknown as Record<string, unknown>,
    };
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

  @Patch(':userId/reset-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  @ApiOperation({
    summary: 'Restablecer contraseña de un usuario (último planificador)',
    description:
      'Genera contraseña temporal y marca mustChangePassword. Devuelve la temporal para compartir (WhatsApp, etc.).',
  })
  @ApiResponse({ status: 200, type: ResetPasswordResponseDto })
  async resetPassword(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<ResetPasswordResponseDto> {
    const result = await this.usersPasswordService.resetPasswordByPlanner(
      actor,
      new Types.ObjectId(userId),
    );
    return {
      message: 'Contraseña restablecida. Comparte la temporal con el usuario.',
      temporaryPassword: result.temporaryPassword,
      user: result.user as unknown as Record<string, unknown>,
    };
  }
}

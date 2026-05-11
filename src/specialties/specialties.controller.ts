import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { SpecialtiesService } from './specialties.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { Types } from 'mongoose';

@ApiTags('Specialties')
@ApiBearerJwt()
@Controller('companies/:companyId/specialties')
@UseGuards(JwtAuthGuard)
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ULTIMO_PLANIFICADOR,
    UserRole.GERENTE,
    UserRole.RESIDENTE,
    UserRole.ESPECIALISTA,
    UserRole.CLIENTE,
  )
  list(@CurrentUser() user: AuthenticatedUser, @Param('companyId') companyId: string) {
    this.specialtiesService.assertCompany(user, companyId);
    return this.specialtiesService.list(new Types.ObjectId(companyId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId') companyId: string,
    @Body() dto: CreateSpecialtyDto,
  ) {
    return this.specialtiesService.create(user, new Types.ObjectId(companyId), dto);
  }
}

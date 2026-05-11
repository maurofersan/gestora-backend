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
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('Companies')
@ApiBearerJwt()
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /** Alta de empresa adicional (opcional). Solo último planificador. */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ULTIMO_PLANIFICADOR)
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get(':companyId')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ULTIMO_PLANIFICADOR,
    UserRole.GERENTE,
    UserRole.RESIDENTE,
    UserRole.ESPECIALISTA,
  )
  async getOne(@CurrentUser() user: AuthenticatedUser, @Param('companyId') companyId: string) {
    if (!user.companyId || user.companyId.toString() !== companyId) {
      throw new ForbiddenException('Empresa no permitida');
    }
    return this.companiesService.findById(companyId);
  }
}

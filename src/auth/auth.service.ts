import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await this.usersService.validatePassword(user, dto.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    user.lastLoginAt = new Date();
    await user.save();

    const payload: JwtPayload = {
      sub: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      type: user.type,
      companyId: user.companyId ? user.companyId.toString() : null,
      specialtyId: user.specialtyId ? user.specialtyId.toString() : null,
      projectIds: (user.projectIds ?? []).map((id) => id.toString()),
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d',
      user: await this.usersService.findSafeById(user._id.toString()),
    };
  }
}

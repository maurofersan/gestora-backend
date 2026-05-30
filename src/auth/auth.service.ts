import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';

import { UsersPasswordService } from '../users/users-password.service';

import { LoginDto } from './dto/login.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';

import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

import { ConfigService } from '@nestjs/config';

import { PasswordResetEmailService } from './password-reset-email.service';



const FORGOT_PASSWORD_MESSAGE =

  'Si el correo pertenece a un usuario de empresa activo, recibirás un email con una contraseña temporal.';



@Injectable()

export class AuthService {

  private readonly logger = new Logger(AuthService.name);



  constructor(

    private readonly usersService: UsersService,

    private readonly usersPasswordService: UsersPasswordService,

    private readonly passwordResetEmail: PasswordResetEmailService,

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



    const safeUser = await this.usersService.findSafeById(user._id.toString());

    if (!safeUser) throw new UnauthorizedException('Credenciales inválidas');



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

      mustChangePassword: safeUser.mustChangePassword,

      user: safeUser,

    };

  }



  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {

    const result = await this.usersPasswordService.assignTemporaryPasswordForCompanyEmail(

      dto.email,

    );



    if (!result) {

      return { message: FORGOT_PASSWORD_MESSAGE };

    }



    const { user, temporaryPassword } = result;

    const { sent } = await this.passwordResetEmail.sendTemporaryPassword({

      toEmail: user.email,

      fullName: user.fullName,

      temporaryPassword,

    });



    if (!sent) {

      this.logger.warn(

        `Contraseña temporal generada para ${user.email} pero el email no se envió (revisa RESEND_API_KEY / EMAIL_FROM).`,

      );

    }



    return { message: FORGOT_PASSWORD_MESSAGE };

  }

}



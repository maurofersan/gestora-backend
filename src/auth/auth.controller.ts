import { Body, Controller, Post } from '@nestjs/common';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';

import {

  ForgotPasswordDto,

  ForgotPasswordResponseDto,

} from './dto/forgot-password.dto';

import { Public } from '../common/decorators/public.decorator';



@ApiTags('Auth')

@Controller('auth')

export class AuthController {

  constructor(private readonly authService: AuthService) {}



  @Public()

  @Post('login')

  @ApiOperation({ summary: 'Login (email + password)', security: [] })

  login(@Body() dto: LoginDto) {

    return this.authService.login(dto);

  }



  @Public()

  @Post('forgot-password')

  @ApiOperation({

    summary: 'Olvidé mi contraseña (solo usuarios de empresa)',

    description:

      'Genera una contraseña temporal y la envía por email. Los clientes deben contactar al último planificador.',

    security: [],

  })

  @ApiResponse({ status: 201, type: ForgotPasswordResponseDto })

  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {

    return this.authService.forgotPassword(dto);

  }

}



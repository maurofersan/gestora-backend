import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Token Expo Push obtenido con expo-notifications',
  })
  @IsString()
  @MinLength(10)
  expoPushToken: string;

  @ApiProperty({ enum: ['ios', 'android'] })
  @IsEnum(['ios', 'android'])
  platform: 'ios' | 'android';
}

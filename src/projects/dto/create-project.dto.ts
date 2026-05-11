import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Proyecto Horizonte Norte' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Usuario con rol cliente', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  clientUserId: string;

  @ApiPropertyOptional({
    description: 'Zona horaria IANA para semanas y alertas',
    example: 'America/Santiago',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

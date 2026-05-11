import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserType } from '../../common/enums/user-type.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'María Fernanda Soto' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ format: 'password', minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserType, enumName: 'UserType' })
  @IsEnum(UserType)
  type: UserType;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Obligatorio si role es especialista',
    example: '507f1f77bcf86cd799439011',
  })
  @ValidateIf((o) => o.role === UserRole.ESPECIALISTA)
  @IsMongoId()
  specialtyId?: string;

  @ApiPropertyOptional({
    description: 'IDs de proyectos a los que tendrá acceso',
    type: [String],
    example: ['507f1f77bcf86cd799439011'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  projectIds?: string[];
}

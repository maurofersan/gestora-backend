import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Constructora Horizonte' })
  @IsString()
  name: string;
}

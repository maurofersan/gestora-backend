import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AgreementStatus } from '../../common/enums/agreement-status.enum';

export class PatchAgreementDto {
  @ApiProperty({ enum: AgreementStatus, enumName: 'AgreementStatus' })
  @IsEnum(AgreementStatus)
  status: AgreementStatus;
}

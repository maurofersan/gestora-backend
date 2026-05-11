import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DutyStatus } from '../../common/enums/duty-status.enum';

export class UpdateDutyDto {
  @ApiProperty({ enum: DutyStatus, enumName: 'DutyStatus' })
  @IsEnum(DutyStatus)
  status: DutyStatus;
}

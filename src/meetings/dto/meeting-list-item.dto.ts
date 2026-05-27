import { ApiProperty } from '@nestjs/swagger';

export class MeetingListItemDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  areaId!: string;

  @ApiProperty({ example: 'Reunión de avance semanal (producción)' })
  title!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  meetingDate!: string;

  @ApiProperty({ enum: ['open', 'closed'] })
  status!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty({ description: 'Total de acuerdos de la reunión', example: 3 })
  agreementsTotal!: number;

  @ApiProperty({ description: 'Acuerdos con status pending', example: 2 })
  agreementsPending!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

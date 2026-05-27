import { ApiProperty } from '@nestjs/swagger';

export class MeetingAreaListItemDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty({ example: 'Área de Producción' })
  name!: string;

  @ApiProperty({
    description: 'Acuerdos con status pending en esta área (todas las reuniones)',
    example: 3,
  })
  pendingAgreementsCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

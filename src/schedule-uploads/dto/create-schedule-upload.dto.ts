import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

const SCHEDULE_SOURCES = ['mpp', 'excel', 'other'] as const;

export class CreateScheduleUploadDto {
  @ApiProperty({
    description: 'URL del archivo subido (el cliente debe subir antes a storage)',
    example: 'https://storage.example.com/cronograma/plan.xlsx',
  })
  @IsString()
  @MinLength(4)
  fileUrl: string;

  @ApiProperty({ enum: SCHEDULE_SOURCES, description: 'Tipo de archivo / origen' })
  @IsIn(SCHEDULE_SOURCES)
  sourceType: (typeof SCHEDULE_SOURCES)[number];
}

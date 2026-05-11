import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEvidenceDto {
  @ApiProperty({ description: 'URL HTTPS del archivo (p. ej. S3 / CDN)', example: 'https://cdn.example.com/evidencias/foto1.jpg' })
  @IsString()
  @MinLength(4)
  url: string;

  @ApiPropertyOptional({ nullable: true, description: 'Miniatura opcional' })
  @IsOptional()
  @IsString()
  thumbUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Metadatos opcionales de la imagen',
    type: 'object',
    additionalProperties: false,
    properties: {
      width: { type: 'number', example: 1920 },
      height: { type: 'number', example: 1080 },
      sizeBytes: { type: 'number', example: 245000 },
      mime: { type: 'string', example: 'image/jpeg' },
    },
  })
  @IsOptional()
  meta?: { width?: number; height?: number; sizeBytes?: number; mime?: string };
}

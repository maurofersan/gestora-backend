import { BadRequestException } from '@nestjs/common';
import {
  SCHEDULE_IMPORT_ALLOWED_EXTENSIONS,
  SCHEDULE_IMPORT_ALLOWED_MIME_TYPES,
  SCHEDULE_IMPORT_MAX_FILE_BYTES,
} from '../schedule-import.constants';

export function assertScheduleImportFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Archivo Excel requerido (campo "file")');
  }

  if (file.size > SCHEDULE_IMPORT_MAX_FILE_BYTES) {
    throw new BadRequestException('Archivo demasiado grande (máx. 10 MB)');
  }

  const name = (file.originalname ?? '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const mimeOk =
    !file.mimetype || SCHEDULE_IMPORT_ALLOWED_MIME_TYPES.has(file.mimetype);
  const extOk = ext && SCHEDULE_IMPORT_ALLOWED_EXTENSIONS.has(ext);

  if (!mimeOk && !extOk) {
    throw new BadRequestException('Formato no válido. Use .xlsx o .xls');
  }

  return file;
}

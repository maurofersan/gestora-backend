import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleUpload, ScheduleUploadSchema } from './schemas/schedule-upload.schema';
import { ScheduleUploadsService } from './schedule-uploads.service';
import { ScheduleUploadsController } from './schedule-uploads.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ScheduleUpload.name, schema: ScheduleUploadSchema }]),
  ],
  controllers: [ScheduleUploadsController],
  providers: [ScheduleUploadsService],
})
export class ScheduleUploadsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { Sector, SectorSchema } from '../sectors/schemas/sector.schema';
import { WorkPackage, WorkPackageSchema } from '../work-packages/schemas/work-package.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Specialty, SpecialtySchema } from '../specialties/schemas/specialty.schema';
import {
  ScheduleUpload,
  ScheduleUploadSchema,
} from '../schedule-uploads/schemas/schedule-upload.schema';
import { ScheduleImportsController } from './schedule-imports.controller';
import { ScheduleImportsService } from './schedule-imports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Sector.name, schema: SectorSchema },
      { name: WorkPackage.name, schema: WorkPackageSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Specialty.name, schema: SpecialtySchema },
      { name: ScheduleUpload.name, schema: ScheduleUploadSchema },
    ]),
  ],
  controllers: [ScheduleImportsController],
  providers: [ScheduleImportsService],
})
export class ScheduleImportsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkPackage, WorkPackageSchema } from './schemas/work-package.schema';
import { WorkPackagesService } from './work-packages.service';
import { WorkPackagesController } from './work-packages.controller';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Specialty, SpecialtySchema } from '../specialties/schemas/specialty.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkPackage.name, schema: WorkPackageSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Specialty.name, schema: SpecialtySchema },
    ]),
  ],
  controllers: [WorkPackagesController],
  providers: [WorkPackagesService],
  exports: [WorkPackagesService, MongooseModule],
})
export class WorkPackagesModule {}

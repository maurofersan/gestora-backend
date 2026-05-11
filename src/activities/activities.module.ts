import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { WorkPackage, WorkPackageSchema } from '../work-packages/schemas/work-package.schema';
import { Sector, SectorSchema } from '../sectors/schemas/sector.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: WorkPackage.name, schema: WorkPackageSchema },
      { name: Sector.name, schema: SectorSchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService, MongooseModule],
})
export class ActivitiesModule {}

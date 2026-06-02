import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PpcWeekly, PpcWeeklySchema } from './schemas/ppc-weekly.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { WorkPackage, WorkPackageSchema } from '../work-packages/schemas/work-package.schema';
import { PpcService } from './ppc.service';
import { PpcController } from './ppc.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PpcWeekly.name, schema: PpcWeeklySchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: WorkPackage.name, schema: WorkPackageSchema },
    ]),
  ],
  controllers: [PpcController],
  providers: [PpcService],
  exports: [PpcService],
})
export class PpcModule {}

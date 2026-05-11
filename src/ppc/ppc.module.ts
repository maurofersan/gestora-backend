import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PpcWeekly, PpcWeeklySchema } from './schemas/ppc-weekly.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { PpcService } from './ppc.service';
import { PpcController } from './ppc.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PpcWeekly.name, schema: PpcWeeklySchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [PpcController],
  providers: [PpcService],
})
export class PpcModule {}

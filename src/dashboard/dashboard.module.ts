import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { Duty, DutySchema } from '../duties/schemas/duty.schema';
import { Agreement, AgreementSchema } from '../meetings/schemas/agreement.schema';
import { PpcWeekly, PpcWeeklySchema } from '../ppc/schemas/ppc-weekly.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Duty.name, schema: DutySchema },
      { name: Agreement.name, schema: AgreementSchema },
      { name: PpcWeekly.name, schema: PpcWeeklySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

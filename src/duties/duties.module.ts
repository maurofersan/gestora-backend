import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Duty, DutySchema } from './schemas/duty.schema';
import { DutiesService } from './duties.service';
import { DutiesController } from './duties.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Duty.name, schema: DutySchema }])],
  controllers: [DutiesController],
  providers: [DutiesService],
})
export class DutiesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LookaheadWeekly, LookaheadWeeklySchema } from './schemas/lookahead-weekly.schema';
import { LookaheadService } from './lookahead.service';
import { LookaheadController } from './lookahead.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LookaheadWeekly.name, schema: LookaheadWeeklySchema }]),
  ],
  controllers: [LookaheadController],
  providers: [LookaheadService],
})
export class LookaheadModule {}

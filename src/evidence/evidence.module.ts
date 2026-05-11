import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityEvidence, ActivityEvidenceSchema } from './schemas/activity-evidence.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityEvidence.name, schema: ActivityEvidenceSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}

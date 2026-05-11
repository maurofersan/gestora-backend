import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingArea, MeetingAreaSchema } from './schemas/meeting-area.schema';
import { Meeting, MeetingSchema } from './schemas/meeting.schema';
import { Agreement, AgreementSchema } from './schemas/agreement.schema';
import { MeetingAreasService } from './meeting-areas.service';
import { MeetingsService } from './meetings.service';
import { AgreementsService } from './agreements.service';
import { MeetingAreasController } from './meeting-areas.controller';
import { MeetingsController } from './meetings.controller';
import { AgreementsController, AgreementPatchController } from './agreements.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingArea.name, schema: MeetingAreaSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: Agreement.name, schema: AgreementSchema },
    ]),
  ],
  controllers: [MeetingAreasController, MeetingsController, AgreementsController, AgreementPatchController],
  providers: [MeetingAreasService, MeetingsService, AgreementsService],
})
export class MeetingsModule {}

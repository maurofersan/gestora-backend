import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';

type LegacyNonCompliance = {
  isActive?: boolean;
  causesText?: string | null;
  correctiveActionsText?: string | null;
  affectedWeeks?: { weekStart: Date; weekEnd: Date; color: string }[];
};

@Injectable()
export class ActivitiesNonComplianceMigrationService implements OnModuleInit {
  private readonly logger = new Logger(ActivitiesNonComplianceMigrationService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async onModuleInit() {
    const { migrated, initialized } = await this.migrateLegacyNonCompliance();
    if (migrated > 0 || initialized > 0) {
      this.logger.log(
        `Migración incumplimientos: ${migrated} actividad(es) convertidas, ${initialized} inicializadas con array vacío`,
      );
    }
  }

  /** Convierte `nonCompliance` (objeto único) → `nonComplianceEvents[]` y elimina el campo legacy. */
  async migrateLegacyNonCompliance(): Promise<{ migrated: number; initialized: number }> {
    const docs = await this.activityModel
      .collection.find({
        $or: [
          { nonCompliance: { $exists: true } },
          { nonComplianceEvents: { $exists: false } },
        ],
      })
      .toArray();

    let migrated = 0;
    let initialized = 0;

    for (const doc of docs) {
      const legacy = doc.nonCompliance as LegacyNonCompliance | undefined;
      const existingEvents = doc.nonComplianceEvents as unknown[] | undefined;

      if (existingEvents && existingEvents.length > 0 && !legacy) {
        continue;
      }

      if (existingEvents && existingEvents.length > 0 && legacy) {
        await this.activityModel.collection.updateOne(
          { _id: doc._id },
          { $unset: { nonCompliance: '' } },
        );
        migrated += 1;
        continue;
      }

      const hasLegacyData =
        legacy &&
        (legacy.isActive === true ||
          !!legacy.causesText ||
          !!legacy.correctiveActionsText ||
          (legacy.affectedWeeks?.length ?? 0) > 0);

      if (hasLegacyData) {
        await this.activityModel.collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              nonComplianceEvents: [
                {
                  _id: new Types.ObjectId(),
                  isActive: legacy!.isActive ?? true,
                  causesText: legacy!.causesText ?? null,
                  correctiveActionsText: legacy!.correctiveActionsText ?? null,
                  affectedWeeks: legacy!.affectedWeeks ?? [],
                  createdAt: doc.updatedAt ?? doc.createdAt ?? new Date(),
                  createdBy: doc.updatedBy ?? doc.createdBy,
                },
              ],
            },
            $unset: { nonCompliance: '' },
          },
        );
        migrated += 1;
      } else if (!existingEvents) {
        await this.activityModel.collection.updateOne(
          { _id: doc._id },
          {
            $set: { nonComplianceEvents: [] },
            $unset: { nonCompliance: '' },
          },
        );
        initialized += 1;
      } else if (legacy) {
        await this.activityModel.collection.updateOne(
          { _id: doc._id },
          { $unset: { nonCompliance: '' } },
        );
        migrated += 1;
      }
    }

    return { migrated, initialized };
  }
}

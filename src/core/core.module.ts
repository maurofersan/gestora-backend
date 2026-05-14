import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { PlanningWeekService } from '../common/planning-week/planning-week.service';

/** Expone dependencias compartidas (guards que necesitan modelos). */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  providers: [ProjectAccessGuard, PlanningWeekService],
  exports: [MongooseModule, ProjectAccessGuard, PlanningWeekService],
})
export class CoreModule {}

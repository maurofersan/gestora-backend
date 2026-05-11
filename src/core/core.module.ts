import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';

/** Expone dependencias compartidas (guards que necesitan modelos). */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  providers: [ProjectAccessGuard],
  exports: [MongooseModule, ProjectAccessGuard],
})
export class CoreModule {}

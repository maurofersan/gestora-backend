import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { envValidationSchema } from './config/env.validation';
import { CoreModule } from './core/core.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MustChangePasswordGuard } from './common/guards/must-change-password.guard';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { SectorsModule } from './sectors/sectors.module';
import { WorkPackagesModule } from './work-packages/work-packages.module';
import { ActivitiesModule } from './activities/activities.module';
import { EvidenceModule } from './evidence/evidence.module';
import { DutiesModule } from './duties/duties.module';
import { MeetingsModule } from './meetings/meetings.module';
import { PpcModule } from './ppc/ppc.module';
import { LookaheadModule } from './lookahead/lookahead.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleUploadsModule } from './schedule-uploads/schedule-uploads.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false, convert: true },
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        dbName: config.get<string>('MONGODB_DATABASE') ?? 'gestora',
      }),
    }),
    CoreModule,
    SetupModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProjectsModule,
    SpecialtiesModule,
    SectorsModule,
    WorkPackagesModule,
    ActivitiesModule,
    EvidenceModule,
    DutiesModule,
    MeetingsModule,
    PpcModule,
    LookaheadModule,
    DashboardModule,
    NotificationsModule,
    ScheduleUploadsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MustChangePasswordGuard },
  ],
})
export class AppModule {}

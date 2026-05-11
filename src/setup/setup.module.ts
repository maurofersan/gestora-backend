import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersPasswordService } from './users-password.service';
import { PasswordCredentialsService } from './password-credentials.service';
import { UsersController } from './users.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [PasswordCredentialsService, UsersService, UsersPasswordService],
  exports: [UsersService, UsersPasswordService, PasswordCredentialsService, MongooseModule],
})
export class UsersModule {}

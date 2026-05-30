import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { generateTemporaryPassword } from '../common/utils/password.util';

@Injectable()
export class PasswordCredentialsService {
  private readonly saltRounds = 10;

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  generateTemporary(): string {
    return generateTemporaryPassword();
  }
}

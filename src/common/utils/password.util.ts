import { randomInt } from 'crypto';

/** Sin caracteres ambiguos (0/O, 1/l/I). */
const TEMP_PASSWORD_CHARSET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';

export const PASSWORD_MIN_LENGTH = 8;

export function generateTemporaryPassword(length = 12): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARSET[randomInt(0, TEMP_PASSWORD_CHARSET.length)];
  }
  return result;
}

import { SetMetadata } from '@nestjs/common';

export const SKIP_MUST_CHANGE_PASSWORD_KEY = 'skipMustChangePassword';

/** Permite la ruta aunque el usuario tenga mustChangePassword (p. ej. cambiar contraseña). */
export const SkipMustChangePassword = () => SetMetadata(SKIP_MUST_CHANGE_PASSWORD_KEY, true);

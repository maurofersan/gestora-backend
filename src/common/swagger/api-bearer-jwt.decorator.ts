import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SWAGGER_JWT_AUTH } from './swagger.constants';

/** Aplica el esquema Bearer JWT documentado en Swagger. */
export function ApiBearerJwt() {
  return applyDecorators(ApiBearerAuth(SWAGGER_JWT_AUTH));
}

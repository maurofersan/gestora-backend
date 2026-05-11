import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SWAGGER_JWT_AUTH } from './common/swagger/swagger.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const swaggerDocument = new DocumentBuilder()
    .setTitle('Gestora API')
    .setDescription(
      'Backend NestJS para la app Gestora (proyectos, actividades, PPC, lookahead, urgencias, evidencias, reuniones). Prefijo global: `/api/v1`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token devuelto por POST /auth/login',
      },
      SWAGGER_JWT_AUTH,
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDocument);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
  });

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(Number.isFinite(port) ? port : 3000);
}

bootstrap();

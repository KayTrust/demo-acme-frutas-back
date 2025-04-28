import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from './configs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DEFAULT_APP_NAME } from './configs/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService<ConfigEnvVars, true>);

  app.enableCors({
    origin: configService.get('ORIGINS'),
  });

  console.log(
    'NODE_ENV:',
    configService.getOrThrow('NODE_ENV', { infer: true }),
  );

  const OpenAPIOptions = new DocumentBuilder()
    .setTitle(DEFAULT_APP_NAME)
    .setDescription('Back: ' + DEFAULT_APP_NAME)
    .setVersion(configService.get('APP_VERSION'))
    .build();

  const document = SwaggerModule.createDocument(app, OpenAPIOptions);
  SwaggerModule.setup('swagger-ui', app, document);

  await app.listen(configService.getOrThrow('PORT', { infer: true }));
}
bootstrap();

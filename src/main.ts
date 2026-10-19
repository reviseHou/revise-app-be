import { Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { setupSession } from './cms/config/session.config';
import { setupViews } from './cms/config/view.config';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  setupSession(app);
  setupViews(app);
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'cms', method: RequestMethod.ALL },
      { path: 'cms/{*path}', method: RequestMethod.ALL },
    ],
  });

  const corsOptions = {
    origin: ['https://revise-hou.tech', 'http://localhost:5173'],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 200,
    credentials: true,
  };
  app.enableCors(corsOptions);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('REVISE-HOU-API')
    .setDescription(`Build time ${new Date().toISOString()}`)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        description: `Please enter token in following format: Bearer <JWT>`,
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    customSiteTitle: 'REVISE-HOU API Docs',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  Logger.log(`CMS: http://localhost:${port}/cms`, 'Bootstrap');
}
bootstrap();

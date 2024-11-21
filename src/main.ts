import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { QueryFailedExceptionFilter } from './common/filters/query-failed-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);
  const appConfig = app.get(AppConfigService);

  app.enableCors({
    origin: true, // Permite todos los orígenes (útil solo en desarrollo)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
  });  

  app.useGlobalPipes(new ValidationPipe());
  
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new QueryFailedExceptionFilter(httpAdapterHost)
  );
  

  await app.listen(appConfig.port);
}
bootstrap();

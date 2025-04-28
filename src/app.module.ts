import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IssuerModule } from './issuer/issuer.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGS_LIST_FOR_LOAD } from './configs';
import { AuthModule } from './auth/auth.module';
import { EvalHttpsMiddleware } from './eval-https/eval-https.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: CONFIGS_LIST_FOR_LOAD,
    }),
    IssuerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EvalHttpsMiddleware).forRoutes("");
  }
}

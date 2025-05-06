import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IssuerModule } from './issuer/issuer.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGS_LIST_FOR_LOAD } from './configs';
import { AuthModule } from './auth/auth.module';
import { VerifierModule } from './verifier/verifier.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { resolve } from 'path';
import { EvalHttpsMiddleware } from './eval-https/eval-https.middleware';
import { AppDataSource } from './database/app-data-source';
import { Verify } from './verifier/entities/verify.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: CONFIGS_LIST_FOR_LOAD,
    }),
    IssuerModule,
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
      // useFactory: () => {
      //   return {
      //     type: 'sqlite',
      //     database: resolve('database/app.db'),
      //     entities: [Verify],
      //     migrations: [resolve('dist/migrations/*.js')],
      //     synchronize: false,
      //     logging: true,
      //     migrationsRun: true,
      //     autoLoadEntities: true,
      //   }
      // },
      // dataSourceFactory: async (options) => {
      //   const dataSource = await new DataSource(options!).initialize();
      //   console.log('Data Source has been initialized!');
      //   return dataSource;
      // },
    }),
    AuthModule,
    VerifierModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EvalHttpsMiddleware).forRoutes("");
  }
}

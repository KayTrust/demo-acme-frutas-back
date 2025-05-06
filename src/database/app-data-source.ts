import { DataSource } from 'typeorm';
import { resolve } from 'path';
import { Verify } from '../verifier/entities/verify.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: resolve('database/app.db'),
  entities: [Verify],
  migrations: [resolve('dist/migrations/*.js')],
  synchronize: false,
  logging: true,
  migrationsRun: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

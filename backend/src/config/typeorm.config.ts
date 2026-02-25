import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'pos_iados',
  password: process.env.DB_PASSWORD || 'pos_iados_2024',
  database: process.env.DB_DATABASE || 'pos_iados',
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // synchronize = false: usamos init SQL en Docker o migraciones manuales
  synchronize: true,
  // En desarrollo: log completo. En producción: solo DDL + errores (visible en logs del instalador)
  logging: process.env.NODE_ENV === 'development' ? true : ['schema', 'warn', 'error'],
  // Pool para estabilidad en Docker
  extra: {
    connectionLimit: 10,
    connectTimeout: 30000,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
exports.dataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'pos_iados',
    password: process.env.DB_PASSWORD || 'pos_iados_2024',
    database: process.env.DB_DATABASE || 'pos_iados',
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development' ? true : ['schema', 'warn', 'error'],
    charset: 'utf8mb4',
    extra: {
        connectionLimit: 10,
        connectTimeout: 30000,
        ssl: false,
        charset: 'utf8mb4',
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        waitForConnections: true,
        queueLimit: 0,
    },
};
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
//# sourceMappingURL=typeorm.config.js.map
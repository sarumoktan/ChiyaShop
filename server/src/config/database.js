const { Sequelize } = require('sequelize');
const env = require('./env');

const logging = env.isProduction ? false : (sql) => console.log(`\x1b[90m[sql]\x1b[0m ${sql}`);

const common = {
  dialect: 'postgres',
  logging,
  define: {
    underscored: true,
    freezeTableName: false,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: env.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
};

const sequelize = env.db.url
  ? new Sequelize(env.db.url, common)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...common,
      host: env.db.host,
      port: env.db.port,
    });

module.exports = sequelize;

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
  console.log("prod")
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log("dev")
}

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Set to true if you want to see SQL queries in the console
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


export { sequelize };
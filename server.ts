import app from "./src/expressapi.ts";
import db from './src/db';
import console from './src/console';

const expressApp = app();
const database = db;
const consoleApp = new console();
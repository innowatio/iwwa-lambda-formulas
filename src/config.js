import dotenv from "dotenv";

dotenv.config();

export const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/test";
export const SENSOR_AGGREGATES_COLLECTION_NAME = process.env.SENSOR_AGGREGATES_COLLECTION_NAME || "readings-daily-aggregates";
export const VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME = "virtual-sensors-formulas";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const MAX_DAYS = process.env.MAX_DAYS || 15;

export const KINESIS_STREAM = process.env.KINESIS_STREAM;
export const KINESIS_PRODUCER_ID = process.env.KINESIS_PRODUCER_ID;

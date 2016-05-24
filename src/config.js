import dotenv from "dotenv";

dotenv.config();

export const MONGODB_URL = process.env.MONGODB_URL;
export const VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME = "virtual-sensors-formulas";
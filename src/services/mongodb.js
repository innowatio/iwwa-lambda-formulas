import {MongoClient} from "mongodb";

import {
    MONGODB_URL,
    SENSOR_AGGREGATES_COLLECTION_NAME,
    VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME
} from "../config";

var mongoClientInstance;

export async function getMongoClient () {
    if (!mongoClientInstance) {
        mongoClientInstance = await MongoClient.connect(MONGODB_URL);
    }
    return mongoClientInstance;
}

export async function upsertVirtualSensor (id, virtualSensor) {
    const db = await getMongoClient();
    await db.collection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME).update(
        {_id: id},
        {$set: virtualSensor},
        {upsert: true}
    );
}

export async function findVirtualSensor (query) {
    return await find(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME, query);
}

export async function findSensorAggregate (query) {
    return await find(SENSOR_AGGREGATES_COLLECTION_NAME, query);
}

async function find (collection, query) {
    const db = await getMongoClient();
    return await db.collection(collection).find(query).toArray();
}

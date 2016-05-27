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
    await upsert(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME, id, virtualSensor);
}

export async function upsertSensorAggregate (id, virtualSensor) {
    await upsert(SENSOR_AGGREGATES_COLLECTION_NAME, id, virtualSensor);
}

export async function upsert (collection, id, object) {
    const db = await getMongoClient();
    await db.collection(collection).updateOne(
        {_id: id},
        {$set: object},
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

import {MongoClient} from "mongodb";

import {
    MONGODB_URL,
    VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME
} from "../config";

var mongoClientInstance;

export async function getMongoClient () {
    if (!mongoClientInstance) {
        mongoClientInstance = await MongoClient.connect(MONGODB_URL);
    }
    return mongoClientInstance;
}

export async function upsert (id, virtualSensor) {
    const db = await getMongoClient();
    await db.collection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME).update(
        {_id: id},
        {$set: virtualSensor},
        {upsert: true}
    );
}

export async function find (query) {
    const db = await getMongoClient();
    return await db.collection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME).find(query).toArray();
}

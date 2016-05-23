import {upsert} from "../services/mongodb";

export async function upsertSensor (decoratedSensor) {
    await upsert(decoratedSensor._id, {
        measurementType: decoratedSensor.measurementType,
        variables: decoratedSensor.variables,
        formulas: decoratedSensor.formulas
    });
} 
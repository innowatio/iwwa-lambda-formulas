import {upsertVirtualSensor} from "../services/mongodb";

export async function upsertSensor (decoratedSensor) {
    await upsertVirtualSensor(decoratedSensor._id, {
        measurementType: decoratedSensor.measurementType,
        variables: decoratedSensor.variables,
        formulas: decoratedSensor.formulas
    });
}
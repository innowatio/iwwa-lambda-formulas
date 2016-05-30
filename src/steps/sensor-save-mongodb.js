import {upsertVirtualSensor} from "../services/mongodb";

export async function upsertSensorFormulas (id, decoratedSensor) {
    await upsertVirtualSensor(id, {
        measurementType: decoratedSensor.measurementType,
        variables: decoratedSensor.variables,
        formulas: decoratedSensor.formulas
    });
}
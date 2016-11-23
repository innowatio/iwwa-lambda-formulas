import log from "../services/logger";
import {upsertVirtualSensor} from "../services/mongodb";


export async function upsertSensorFormulas (id, decoratedSensor) {
    log.info({decoratedSensor});
    await upsertVirtualSensor(id, {
        measurementType: decoratedSensor.measurementType,
        variables: decoratedSensor.variables,
        formulas: decoratedSensor.formulas
    });
}

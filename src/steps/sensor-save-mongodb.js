import log from "../services/logger";
import {upsertVirtualSensor} from "../services/mongodb";


export async function upsertSensorFormulas (id, decoratedSensor) {
    log.debug({decoratedSensor});
    await upsertVirtualSensor(id, {
        measurementType: decoratedSensor.measurementType,
        variables: decoratedSensor.variables,
        formulas: decoratedSensor.formulas
    });
}

import log from "./services/logger";
import {upsertSensorFormulas} from "./steps/sensor-save-mongodb";
import {replySensorMeasurements} from "./steps/sensor-reply-measurements";
import {decorateSensorFormula} from "./steps/sensor-formulas-decorator";

export default async function pipeline (event) {

    /*
     *   Workaround: some events have been incorrectly generated and thus don't
     *   have an `element` property. When processing said events, just return and
     *   move on without failing, as failures can block the kinesis stream.
     */
    const sensor = event.data.element;
    if (!event.data.id 
        || !sensor 
        || !sensor.virtual
        || !sensor.formulas) {
        return null;
    }
    log.info({event});

    const decoratedSensorFormula = decorateSensorFormula(sensor);

    await replySensorMeasurements(decoratedSensorFormula);

    await upsertSensorFormulas(event.data.id, decoratedSensorFormula);

    return null;
}

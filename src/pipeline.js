import log from "./services/logger";
import {upsertSensorFormulas} from "./steps/sensor-save-mongodb";
import {replySensorMeasurements} from "./steps/sensor-reply-measurements";
import {decorateSensor} from "./steps/sensor-formulas-decorator";

export default async function pipeline (event) {

    log.info(event, "event");
    /*
     *   Workaround: some events have been incorrectly generated and thus don't
     *   have an `element` property. When processing said events, just return and
     *   move on without failing, as failures can block the kinesis stream.
     */
    const sensor = event.data.element;
    if (!sensor || !event.data.id || !sensor.virtual) {
        return null;
    }
    
    const decoratedSensor = decorateSensor(sensor);

    await replySensorMeasurements(decoratedSensor);
    
    await upsertSensorFormulas(decoratedSensor);
    
    return null;
}
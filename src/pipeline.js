import log from "./services/logger";

import {upsertSensorFormulas} from "./steps/sensor-save-mongodb";
import {decorateSensorFormula} from "./steps/sensor-formulas-decorator";

export default async function pipeline (event) {

    /*
     *   Workaround: some events have been incorrectly generated and thus don't
     *   have an `element` property. When processing said events, just return and
     *   move on without failing, as failures can block the kinesis stream.
     */
    try {
        const sensor = event.data.element;
        if (!event.data.id 
            || !sensor 
            || !sensor.virtual
            || !sensor.formulas) {
            return null;
        }
        log.info({event});

        const decoratedSensorFormula = decorateSensorFormula({
            ...sensor,
            id: event.data.id
        });

        await upsertSensorFormulas(event.data.id, decoratedSensorFormula);
    } catch (error) {
        log.error(error);
        throw error;
    }
}

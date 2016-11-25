import {map} from "bluebird";
import isequal from "lodash.isequal";
import moment from "moment";

import log from "../services/logger";
import {dispatch} from "../services/dispatcher";
import {findVirtualSensor, findSensorAggregate} from "../services/mongodb";

export async function replySensorMeasurements (decoratedSensor) {
    log.info({decoratedSensor});

    var sensors = await findVirtualSensor({_id: decoratedSensor.id});
    log.info({sensors});

    var formulas = sensors.reduce((prev, saved) => {
        return [...prev, ...findFormulasDelta(decoratedSensor, saved)];
    }, []);
    log.info({formulas});

    const aggregates = retrieveSensorData(formulas);
    await map(aggregates, async (aggregate) => {

        log.info({aggregate});

        await map(aggregate.measurements, async (formulaData) => {

            const sensorsData = await findSensorAggregate({
                _id: {
                    $in: formulaData.id
                }
            });
            log.info({sensorsData});

            await map(sensorsData, async (sensorData) => {
                const splittedValues = sensorData.measurementValues.split(",").filter(x => x);
                const splittedTimes = sensorData.measurementTimes.split(",").filter(x => x);

                await map(splittedValues, async (value, index) => {
                    const timestamp = splittedTimes[index];

                    const kinesisEvent = createKinesisEvent(sensorData, value, timestamp);
                    log.info(kinesisEvent.element);

                    await dispatch("element inserted in collection readings", kinesisEvent);
                }, {concurrency: 0});
            });
        });
    });
}

export function findFormulasDelta (sensor, sensorCompare) {
    const sensor1 = sensor;
    const sensor2 = sensorCompare;
    var formulaDelta = sensor1.formulas.reduce((prev, formula) => {
        var finded = sensor2.formulas.find(x => {
            return x.formula === formula.formula &&
                isequal(x.measurementType.sort(), formula.measurementType.sort()) &&
                x.start === formula.start &&
                x.end === formula.end &&
                x.aggregationType === formula.aggregationType;
        });
        return finded ? [...prev] : [...prev, formula];
    }, []);
    return formulaDelta;
}

export function retrieveSensorData (formulas) {
    const result = formulas.map(formula => {
        const end = moment.utc(formula.end);
        var start = moment.utc(formula.start);
        const measurements = formula.measurementType.reduce((prevMeasurement, measurementType) => {
            while (start.isSameOrBefore(end)) {
                const id = formula.variables.map((variable) => {
                    return `${variable}-${start.format("YYYY-MM-DD")}-reading-${measurementType}`;
                });
                prevMeasurement = [...prevMeasurement, {
                    date: start.format("YYYY-MM-DD"),
                    id,
                    measurementType
                }];
                start.add({
                    days: 1
                });
            }
            start = moment.utc(formula.start);
            return prevMeasurement;
        }, {});
        return {
            formula: formula.formula,
            measurements
        };
    });
    return result;
}

function createKinesisEvent (aggregate, value, time) {
    return {
        element: {
            sensorId: aggregate.sensorId,
            date: moment.utc(parseInt(time)).toISOString(),
            source: aggregate.source,
            measurements: [{
                type: aggregate.measurementType,
                value: value,
                unitOfMeasurement: aggregate.unitOfMeasurement
            }]
        }
    };
}

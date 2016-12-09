import {mapSeries} from "bluebird";
import flattendeep from "lodash.flattendeep";
import isequal from "lodash.isequal";
import moment from "moment";

import log from "../services/logger";
import {dispatch} from "../services/dispatcher";
import {findVirtualSensor, findSensorAggregate} from "../services/mongodb";

export async function replySensorMeasurements (decoratedSensor) {
    log.info({
        decoratedSensor
    });

    var sensors = await findVirtualSensor({_id: decoratedSensor.id});
    log.info({sensors});

    if (sensors) {
        var formulas = findFormulasDelta(decoratedSensor, sensors);
        log.info({formulas});

        const aggregatesByFormula = retrieveSensorData(formulas);

        await mapSeries(aggregatesByFormula, async (aggregateByFormula) => {

            log.debug({
                ids: aggregateByFormula.ids
            });

            const sensorsData = await findSensorAggregate({
                _id: {
                    $in: aggregateByFormula.ids
                }
            });

            log.debug({sensorsData});

            await mapSeries(sensorsData, async (sensorData) => {

                const splittedValues = sensorData.measurementValues.split(",").filter(x => x);
                const splittedTimes = sensorData.measurementTimes.split(",").filter(x => x);

                await mapSeries(splittedValues, async (value, index) => {
                    const timestamp = splittedTimes[index];

                    const kinesisEvent = createKinesisEvent(sensorData, value, timestamp);

                    await dispatch("element inserted in collection readings", kinesisEvent);
                });
            });
        });
    }
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
        const now = moment.utc();
        const end = moment.utc(formula.end);
        var start = moment.utc(formula.start);

        var days = Math.ceil((moment.duration(end.valueOf() - start.valueOf()).asDays()));

        var dates = [];
        var i = 0;
        while (now.valueOf() >= start.valueOf() && days >= 0) {
            dates[i++] = `${start.format("YYYY-MM-DD")}`;
            days--;
            start.add({
                days: 1
            });
        }

        const datesWithMeasurement = flattendeep(formula.measurementType.map(measurementType => {
            return dates.map(date => {
                return `${date}-reading-${measurementType}`;
            });
        }));

        const completeDates = flattendeep(formula.variables.map(sensorId => {
            return datesWithMeasurement.map(date => {
                return `${sensorId}-${date}`;
            });
        }));


        return {
            formula: formula.formula,
            ids: completeDates
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
                value: parseFloat(value),
                unitOfMeasurement: aggregate.unitOfMeasurement
            }]
        }
    };
}

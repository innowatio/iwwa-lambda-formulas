import isequal from "lodash.isequal";
import moment from "moment";

import {evaluateFormula} from "iwwa-formula-resolver";

import {findVirtualSensor, findSensorAggregate, upsertSensor} from "../services/mongodb";

export async function replySensor (decoratedSensor) {
    var sensors = await findVirtualSensor({_id: decoratedSensor._id});
    var formulas = sensors.reduce((prev, saved) => {
        return [...prev, ...findFormulasDelta(decoratedSensor, saved)];
    }, []);
    
    const aggregates = retrieveSensorIds(formulas);
    
    aggregates.forEach(async (aggregate) => {
        aggregate.measurements.forEach(async (formulaData) => {
            const sensorsData = await findSensorAggregate({
                _id: {
                    $in: formulaData.id
                }
            });
            
            const result = evaluateFormula(aggregate, sensorsData, aggregate.measurementDelta);
            
            const virtualSensor = {
                sensorId: decoratedSensor._id,
                day: formulaData.date,
                source: "reading",
                measurementsDeltaInMs: 300000,
                ...result
            };
            
            const virtualId = `${decoratedSensor._id}-${formulaData.date}-reading-${formulaData.measurementType}`;
            
            await upsertSensor(virtualId, virtualSensor);
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
                x.end === formula.end;
        });
        return finded ? [...prev] : [...prev, formula];
    }, []);
    return formulaDelta;
}

export function retrieveSensorIds (formulas) {
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
            measurementDelta: formula.measurementDelta ? formula.measurementDelta : 300000,
            measurements
        };
    });
    return result;
}
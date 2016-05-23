import flattendeep from "lodash.flattendeep";
import isEqual from "lodash.isEqual";
import moment from "moment";

import {find} from "../services/mongodb";

export async function replySensor (decoratedSensor) {
    var sensors = await find({_id: decoratedSensor._id});
    var formulas = sensors.reduce((prev, saved) => {
        return [...prev, ...findFormulasDelta(decoratedSensor, saved)];
    }, []);
    findSensorsIds(formulas);
}

export function findFormulasDelta (sensor, sensorCompare) {
    const sensor1 = sensor;
    const sensor2 = sensorCompare;
    var formulaDelta = sensor1.formulas.reduce((prev, formula) => {
        var finded = sensor2.formulas.find(x => {
            return x.formula === formula.formula &&
                isEqual(x.measurementType.sort(), formula.measurementType.sort()) &&
                x.start === formula.start &&
                x.end === formula.end;
        });
        return finded ? [...prev] : [...prev, formula];
    }, []);
    return formulaDelta;
}

export function findSensorsIds (formulas) {
    return flattendeep(formulas.map(formula => {
        return formula.variables.map(variable => {
            const end = moment.utc(formula.end);
            var start = moment.utc(formula.start);
            var sensors = [];
            while (start.isSameOrBefore(end)) {
                formula.measurementType.forEach(measure => {
                    sensors.push(`${variable}-readings-${start.format("YYYY-MM-DD")}-reading-${measure}`);
                });
                start.add({
                    days: 1
                });
            }
            return sensors;
        });
    }));
}
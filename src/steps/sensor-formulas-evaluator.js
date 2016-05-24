import flattendeep from "lodash.flattendeep"; 
import uniq from "lodash.uniq";

import {parse} from "mathjs";

export function evaluateFormulaDaily (virtualSensor, sensorsData, measurementDelta = 300000) {

    const measurements = timestampFlatten(processSensorData(sensorsData, measurementDelta));
    const timestamps = uniq(measurements.map(x => x.measurementTime));

    const parsedFormula = parse(virtualSensor.formula);
    const formula = parsedFormula.compile();
    
    const virtualMeasurements = timestamps.reduce((prev, timestamp) => {
        const filtered = measurements
            .filter(x => x.measurementTime === timestamp)
            .reduce((prev, current) => {
                prev[current.sensorId] = current.measurementValue;
                return prev;
            }, {});
        try {
            const result = formula.eval(filtered);
            return {
                measurementValues: [...prev.measurementValues, result],
                measurementTimes: [...prev.measurementTimes, timestamp]
            };
        } catch (error) {
            console.log("Error while parsing formula, skipping measurement");
        }
        return {
            measurementValues: [...prev.measurementValues],
            measurementTimes: [...prev.measurementTimes]
        };
    }, {
        measurementValues: [],
        measurementTimes: []
    });

    return {
        measurementValues: virtualMeasurements.measurementValues.join(","),
        measurementTimes: virtualMeasurements.measurementTimes.join(",")
    };
}

function processSensorData (sensorsData, measurementDelta) {
    return sensorsData.map(sensor => {
        const sensorSplitted = splitMeasurements(sensor, measurementDelta);
        return {
            ...sensorSplitted,
            measurements: sensorSplitted.measurementValues.reduce((prev, measurementValue, index) => {
                return [...prev, {
                    measurementValue,
                    measurementTime: sensorSplitted.measurementTimes[index]
                }];
            }, [])
        };
    });
}

function timestampFlatten (sensors) {
    return flattendeep(sensors.map((sensor) => {
        return sensor.measurements.map(measurement => {
            return {
                sensorId: sensor.sensorId,
                ...measurement
            };
        });
    }));
}

function splitMeasurements (sensor, measurementDelta) {
    return {
        ...sensor,
        measurementValues: sensor.measurementValues.split(",").map(x => parseFloat(x)),
        measurementTimes: normalizeTimestamps(sensor.measurementTimes.split(","), measurementDelta)
    };
}

function normalizeTimestamps (timestamps, measurementDelta) {
    return timestamps.map(timestamp => {
        return timestamp - (timestamp % measurementDelta);
    });
}
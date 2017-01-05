import {expect} from "chai";

import {
    decorateSensorFormula
} from "steps/sensor-formulas-decorator";

describe("Decorate formulas", () => {

    it("`decorateSensorFormula` return the correct decorated formula", () => {
        const sensor = {
            id: "sensorId-0",
            formulas: [{
                formula: "x+y",
                variables: [{
                    symbol: "x",
                    sensorId: "sensorId-1",
                    measurementType: "temperature"
                }, {
                    symbol: "y",
                    sensorId: "sensorId-2",
                    measurementType: "co2"
                }],
                start: "1970-01-01T00:00:000Z",
                end: "1970-01-02T00:00:00Z",
                measurementType: "customType",
                measurementUnit: "°C/ppm",
                measurementSample: 60000
            }, {
                formula: "x+273",
                variables: [{
                    symbol: "x",
                    sensorId: "sensorId-3",
                    measurementType: "temperature"
                }],
                start: "1970-01-01T00:00:000Z",
                end: "1970-01-02T00:00:00Z",
                measurementType: "temperature",
                measurementUnit: "Kelvin",
                measurementSample: 60000
            }]
        };

        const result = decorateSensorFormula(sensor);

        expect(result).to.be.deep.equal({
            id: sensor.id,
            formulas: sensor.formulas,
            sensorsIds: [
                "sensorId-1",
                "sensorId-2",
                "sensorId-3"
            ]
        });
    });
});

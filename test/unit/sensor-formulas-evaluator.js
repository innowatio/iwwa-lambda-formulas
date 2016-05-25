import {expect} from "chai";

import {evaluateFormulaDaily} from "steps/sensor-formulas-evaluator";

describe("`evaluateFormula` function", () => {
    it("return the correct arrays of sensors-readings-aggregates ids", async () => {
        const formula = {
            formula: "(ANZ01+ANZ02+ANZ03)/2",
            variables: ["ANZ01", "ANZ02"]
        };
        const sensorsData = [{
            sensorId: "ANZ01",
            measurementValues: "1,2,3,4,5,6,7,9,10",
            measurementTimes: "1453939200000,1453939500000,1453939800000,1453940100000,1453940400000,1453940700000,1453941000000,1453941300000,1453941600000"
        }, {
            sensorId: "ANZ02",
            measurementValues: "2,3,4,5,6,7,9,10",
            measurementTimes: "1453939500000,1453939800000,1453940100000,1453940400000,1453940700000,1453941000000,1453941300000,1453941600000"
        }, {
            sensorId: "ANZ03",
            measurementValues: "0,0,0,0,0,0,0,10",
            measurementTimes: "1453939500000,1453939800000,1453940100000,1453940400000,1453940700000,1453941000000,1453941300000,1453941600000"
        }];
        const expected = {
            measurementValues: "2,3,4,5,6,7,9,15",
            measurementTimes: "1453939500000,1453939800000,1453940100000,1453940400000,1453940700000,1453941000000,1453941300000,1453941600000"
        };
        const result = evaluateFormulaDaily(formula, sensorsData);
        expect(result).to.deep.equal(expected);
    });
});


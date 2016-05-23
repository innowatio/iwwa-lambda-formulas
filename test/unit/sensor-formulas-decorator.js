import {expect} from "chai";

import {retriveFormulaVariables, retriveFormulaMeasurementType} from "steps/sensor-formulas-decorator";

describe("`retriveFormulaVariables` function", () => {
    it("return the correct array of strings [CASE 0: no operands]", () => {
        const formula = "sensor0";
        const expected = ["sensor0"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 1: +]", () => {
        const formula = "sensor1 + sensor2";
        const expected = ["sensor1", "sensor2"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 2: -]", () => {
        const formula = "sensor1 - sensor2";
        const expected = ["sensor1", "sensor2"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 3: *]", () => {
        const formula = "sensor1 * sensor2";
        const expected = ["sensor1", "sensor2"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 4: /]", () => {
        const formula = "sensor1 / sensor2";
        const expected = ["sensor1", "sensor2"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 5: + - * /]", () => {
        const formula = "sensor1 + sensor2 * sensor1 / sensor3";
        const expected = ["sensor1", "sensor2", "sensor3"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct array of strings [CASE 6: + - * / ( )]", () => {
        const formula = "((sensor0 + sensor1) + sensor2) * (sensor1) / 2";
        const expected = ["sensor0", "sensor1", "sensor2"];
        const result = retriveFormulaVariables(formula);
        expect(result).to.deep.equal(expected);
    });
});

describe("`retriveFormulaMeasurementType` function", () => {
    it("return the correct array of strings", () => {
        const formulas = [{
            measurementType: ["activeEnergy", "temperature"]
        }, {
            measurementType: ["maxPower", "temperature"]
        }];
        const expected = ["activeEnergy", "temperature", "maxPower"];
        const result = retriveFormulaMeasurementType(formulas);

        expect(result).to.deep.equal(expected);
    });
});

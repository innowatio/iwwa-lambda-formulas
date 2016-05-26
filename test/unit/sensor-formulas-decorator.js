import {expect} from "chai";

import {retriveFormulaMeasurementType} from "steps/sensor-formulas-decorator";

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

import {expect} from "chai";

import {findFormulasDelta, findSensorsIds} from "steps/sensor-reply-measurements";

describe("`findFormulasDelta` function", () => {
    it("return the correct diff of formulas [CASE 0]", async () => {
        const sensorEvent = {
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                start: "1970-01-01T00:00:00Z",
                end: "2011-01-01T00:00:00Z"
            }, {
                formula: "ANZ01 + ANZ02",
                measurementType: ["temperature"],
                start: "2011-01-01T00:00:00.000Z",
                end: "2170-01-01T00:00:00.000Z"
            }]
        };
        const expected = [];
        const result = findFormulasDelta(sensorEvent, sensorEvent);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct diff of formulas [CASE 1]", async () => {
        const sensorEvent = {
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                start: "1970-01-01T00:00:00Z",
                end: "2011-01-01T00:00:00Z"
            }, {
                formula: "ANZ01 + ANZ02",
                measurementType: ["temperature"],
                start: "2011-01-01T00:00:00.000Z",
                end: "2170-01-01T00:00:00.000Z"
            }]
        };
        const sensorDb = {
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                start: "1970-01-01T00:00:00Z",
                end: "2170-01-01T00:00:00Z"
            }]
        };
        const expected = [{
            formula: "IT001E00088487",
            measurementType: ["activeEnergy", "temperature"],
            start: "1970-01-01T00:00:00Z",
            end: "2011-01-01T00:00:00Z"
        }, {
            formula: "ANZ01 + ANZ02",
            measurementType: ["temperature"],
            start: "2011-01-01T00:00:00.000Z",
            end: "2170-01-01T00:00:00.000Z"
        }];
        const result = findFormulasDelta(sensorEvent, sensorDb);
        expect(result).to.deep.equal(expected);
    });
    it("return the correct diff of formulas [CASE 2]", async () => {
        const sensorEvent = {
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                start: "1970-01-01T00:00:00Z",
                end: "2170-01-01T00:00:00Z"
            }]
        };
        const sensorDb = {
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                start: "1970-01-01T00:00:00Z",
                end: "2011-01-01T00:00:00Z"
            }, {
                formula: "ANZ01 + ANZ02",
                measurementType: ["temperature"],
                start: "2011-01-01T00:00:00.000Z",
                end: "2170-01-01T00:00:00.000Z"
            }]
        };
        const expected = [{
            formula: "IT001E00088487",
            measurementType: ["activeEnergy", "temperature"],
            start: "1970-01-01T00:00:00Z",
            end: "2170-01-01T00:00:00Z"
        }];
        const result = findFormulasDelta(sensorEvent, sensorDb);
        expect(result).to.deep.equal(expected);
    });
});

describe("`findSensorsIds` function", () => {
    it("return the correct arrays of sensors-readings-aggregates ids", async () => {
        const formulas = [{
            formula: "IT001E00088487",
            measurementType: ["activeEnergy", "temperature"],
            variables: ["IT001E00088487"],
            start: "1970-01-01T00:00:00Z",
            end: "1970-01-03T00:00:00Z"
        }];
        const expected = [
            "IT001E00088487-readings-1970-01-01-reading-activeEnergy",
            "IT001E00088487-readings-1970-01-01-reading-temperature",
            "IT001E00088487-readings-1970-01-02-reading-activeEnergy",
            "IT001E00088487-readings-1970-01-02-reading-temperature",
            "IT001E00088487-readings-1970-01-03-reading-activeEnergy",
            "IT001E00088487-readings-1970-01-03-reading-temperature"
        ];
        const result = findSensorsIds(formulas);
        expect(result).to.deep.equal(expected);
    });
});


import {expect} from "chai";

import {findFormulasDelta, retrieveSensorData} from "steps/sensor-reply-measurements";

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

describe("`retrieveSensorIds` function", () => {
    it("return the correct arrays of sensors-readings-aggregates ids", async () => {
        const formulas = [{
            formula: "ANZ01 + ANZ02",
            measurementType: ["activeEnergy", "temperature"],
            variables: ["ANZ01", "ANZ02"],
            start: "1970-01-01T00:00:00Z",
            end: "1970-01-03T00:00:00Z"
        }];
        const expected = [{
            formula: "ANZ01 + ANZ02",
            measurements: [
                {
                    date: "1970-01-01",
                    id: [
                        "ANZ01-1970-01-01-reading-activeEnergy",
                        "ANZ02-1970-01-01-reading-activeEnergy"
                    ],
                    "measurementType": "activeEnergy"
                }, {
                    date: "1970-01-02",
                    id: [
                        "ANZ01-1970-01-02-reading-activeEnergy",
                        "ANZ02-1970-01-02-reading-activeEnergy"
                    ],
                    "measurementType": "activeEnergy"
                }, {
                    date: "1970-01-03",
                    id: [
                        "ANZ01-1970-01-03-reading-activeEnergy",
                        "ANZ02-1970-01-03-reading-activeEnergy"
                    ],
                    "measurementType": "activeEnergy"
                }, {
                    date: "1970-01-01",
                    id: [
                        "ANZ01-1970-01-01-reading-temperature",
                        "ANZ02-1970-01-01-reading-temperature"
                    ],
                    "measurementType": "temperature"
                }, {
                    date: "1970-01-02",
                    id: [
                        "ANZ01-1970-01-02-reading-temperature",
                        "ANZ02-1970-01-02-reading-temperature"
                    ],
                    "measurementType": "temperature"
                }, {
                    date: "1970-01-03",
                    id: [
                        "ANZ01-1970-01-03-reading-temperature",
                        "ANZ02-1970-01-03-reading-temperature"
                    ],
                    "measurementType": "temperature"
                }
            ]
        }];
        const result = retrieveSensorData(formulas);
        expect(result).to.deep.equal(expected);
    });
});


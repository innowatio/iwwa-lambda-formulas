import {expect} from "chai";
import moment from "moment";
import sinon from "sinon";

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

    const clock = sinon.useFakeTimers(moment.utc("2016-01-03").valueOf());

    after(() => {
        clock.reset();
    });

    it("return the correct arrays of sensors-readings-aggregates ids", async () => {
        const formulas = [{
            formula: "ANZ01 + ANZ02",
            measurementType: ["activeEnergy", "temperature"],
            variables: ["ANZ01", "ANZ02"],
            start: "2016-01-01T00:00:00Z",
            end: "2100-01-01T00:04:00Z"
        }];
        const expected = [{
            formula: "ANZ01 + ANZ02",
            ids: [
                "ANZ01-2016-01-01-reading-activeEnergy",
                "ANZ01-2016-01-02-reading-activeEnergy",
                "ANZ01-2016-01-03-reading-activeEnergy",
                "ANZ01-2016-01-01-reading-temperature",
                "ANZ01-2016-01-02-reading-temperature",
                "ANZ01-2016-01-03-reading-temperature",
                "ANZ02-2016-01-01-reading-activeEnergy",
                "ANZ02-2016-01-02-reading-activeEnergy",
                "ANZ02-2016-01-03-reading-activeEnergy",
                "ANZ02-2016-01-01-reading-temperature",
                "ANZ02-2016-01-02-reading-temperature",
                "ANZ02-2016-01-03-reading-temperature"
            ]
        }];
        const result = retrieveSensorData(formulas);
        expect(result).to.deep.equal(expected);

        const formulasZthl = [{
            formula: "ZTHL01 + ZTHL02",
            measurementType: ["temperature"],
            variables: ["ZTHL01", "ZTHL02"],
            start: "2016-01-01T00:00:00Z",
            end: "2016-01-02T00:00:00Z"
        }];
        const expectedZthl = [{
            formula: "ZTHL01 + ZTHL02",
            ids: [
                "ZTHL01-2016-01-01-reading-temperature",
                "ZTHL01-2016-01-02-reading-temperature",
                "ZTHL02-2016-01-01-reading-temperature",
                "ZTHL02-2016-01-02-reading-temperature"
            ]
        }];
        const resultZthl = retrieveSensorData(formulasZthl);
        expect(resultZthl).to.deep.equal(expectedZthl);

        const formulasCapped = [{
            formula: "COOV01",
            measurementType: ["temperature"],
            variables: ["COOV01"],
            start: "2015-10-20T00:00:00Z",
            end: "2016-01-02T00:00:00Z"
        }];
        const expectedCapped = [{
            formula: "COOV01",
            ids: [
                "COOV01-2015-12-19-reading-temperature",
                "COOV01-2015-12-20-reading-temperature",
                "COOV01-2015-12-21-reading-temperature",
                "COOV01-2015-12-22-reading-temperature",
                "COOV01-2015-12-23-reading-temperature",
                "COOV01-2015-12-24-reading-temperature",
                "COOV01-2015-12-25-reading-temperature",
                "COOV01-2015-12-26-reading-temperature",
                "COOV01-2015-12-27-reading-temperature",
                "COOV01-2015-12-28-reading-temperature",
                "COOV01-2015-12-29-reading-temperature",
                "COOV01-2015-12-30-reading-temperature",
                "COOV01-2015-12-31-reading-temperature",
                "COOV01-2016-01-01-reading-temperature",
                "COOV01-2016-01-02-reading-temperature"
            ]
        }];
        const resultCapped = retrieveSensorData(formulasCapped);
        expect(resultCapped).to.deep.equal(expectedCapped);
    });
});


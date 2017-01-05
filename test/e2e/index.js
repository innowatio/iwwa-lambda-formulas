import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import {handler} from "index";
import {getMongoClient, findSensorAggregate, findVirtualSensor} from "services/mongodb";
import {getEventFromObject} from "../mocks";
import {SENSOR_AGGREGATES_COLLECTION_NAME, VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME} from "config";

const sensor = {
    description: "A description",
    name: "Sito with sensors",
    virtual: false,
    formulas: [{
        formula: "x",
        variables: [{
            symbol: "x",
            sensorId: "IT0000011",
            measurementType: "activeEnergy"
        }],
        start: "1970-01-01T00:00:00Z",
        end: "2170-01-01T00:00:00Z",
        measurementType: "activeEnergy",
        measurementUnit: "kWh",
        measurementSample: 60000
    }, {
        formula: "x + y",
        variables: [{
            symbol: "x",
            sensorId: "ANZ01",
            measurementType: "temperature"
        }, {
            symbol: "y",
            sensorId: "ANZ02",
            measurementType: "temperature"
        }],
        start: "2011-01-01T00:00:00.000Z",
        end: "2100-01-01T00:00:00.000Z",
        measurementType: "temperature",
        measurementUnit: "°C",
        measurementSample: 60000
    }]
};

const sensorAggregateVirtual = {
    _id: "VIRTUAL01-2016-01-01-reading-activeEnergy",
    day: "2016-01-01",
    sensorId: "VIRTUAL01",
    source: "reading",
    measurementType: "activeEnergy",
    unitOfMeasurement: "kWh",
    measurementValues: "4.808",
    measurementTimes: "1453940100000"
};

const sensorAggregateAnz01 = {
    _id: "ANZ01-2016-01-01-reading-temperature",
    day: "2016-01-01",
    sensorId: "ANZ01",
    source: "reading",
    measurementType: "temperature",
    unitOfMeasurement: "°C",
    measurementValues: "808,600,500",
    measurementTimes: "1453940100000,1453940400000,1453940700000"
};

describe("On sensor", async () => {

    var db;
    var clock;
    const now = new Date("2016-01-15").getTime();
    const context = {
        succeed: sinon.spy(),
        fail: sinon.spy()
    };

    before(async () => {
        db = await getMongoClient();
        await db.createCollection(SENSOR_AGGREGATES_COLLECTION_NAME);
        await db.createCollection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME);
    });

    after(async () => {
        await db.dropCollection(SENSOR_AGGREGATES_COLLECTION_NAME);
        await db.dropCollection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME);
        await db.close();
    });

    beforeEach(() => {
        clock = sinon.useFakeTimers(now);
    });

    afterEach(async () => {
        context.succeed.reset();
        context.fail.reset();
        clock.restore();
    });

    it("fail on malformed object", async () => {

        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                variable: {
                    symbol: "x",
                    sensorId: "ANZ01",
                    measurementType: "activeEnergy"
                }
            }]
        };

        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: virtualSensor,
                id: "VIRTUAL01"
            },
            type: "element inserted in collection sensors"
        });

        await handler(event, context);

        expect(context.fail).to.have.been.calledOnce;
    });

    it("receive real sensor and do nothing", async () => {
        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: sensor,
                id: "VIRTUAL01"
            },
            type: "element inserted in collection sensors"
        });

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({});
        expect(allSensors).to.equal(null);
    });

    it("receive a new virtual sensor and upsert", async () => {
        const virtualSensor = {
            ...sensor,
            virtual: true
        };

        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: virtualSensor,
                id: "VIRTUAL01"
            },
            type: "element inserted in collection sensors"
        });

        const expected = {
            _id: "VIRTUAL01",
            formulas: virtualSensor.formulas,
            sensorsIds: ["IT0000011", "ANZ01", "ANZ02"]
        };

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const savedSensor = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(savedSensor).to.deep.equal(expected);
    });

    it("receive an already saved virtual sensor and upsert [CASO 0]", async () => {

        const virtualSensor = {
            ...sensor,
            virtual: true
        };

        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: virtualSensor,
                id: "VIRTUAL01"
            },
            type: "element inserted in collection sensors"
        });

        const expected = {
            _id: "VIRTUAL01",
            formulas: virtualSensor.formulas,
            sensorsIds: ["IT0000011", "ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const savedSensor = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(savedSensor).to.deep.equal(expected);
    });

    it("receive an already saved virtual sensor and upsert [CASE 1]", async () => {

        await db.collection(SENSOR_AGGREGATES_COLLECTION_NAME).insert(sensorAggregateVirtual);
        await db.collection(SENSOR_AGGREGATES_COLLECTION_NAME).insert(sensorAggregateAnz01);

        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                formula: "x",
                variables: [{
                    symbol: "x",
                    sensorId: "ANZ01",
                    measurementType: "activeEnergy"
                }],
                start: "2000-01-01T00:00:00Z",
                end: "2020-01-02T00:00:00Z",
                measurementType: "temperature",
                measurementUnit: "°C",
                measurementSample: 60000
            }]
        };

        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: virtualSensor,
                id: "VIRTUAL01"
            },
            type: "element inserted in collection sensors"
        });

        const expected = {
            _id: "VIRTUAL01",
            formulas: [{
                formula: "x",
                variables: [{
                    symbol: "x",
                    sensorId: "ANZ01",
                    measurementType: "activeEnergy"
                }],
                start: "2000-01-01T00:00:00Z",
                end: "2020-01-02T00:00:00Z",
                measurementType: "temperature",
                measurementUnit: "°C",
                measurementSample: 60000
            }],
            sensorsIds: ["ANZ01"]
        };

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const virtualSensors = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(virtualSensors).to.deep.equal(expected);

        const sensorAggregates = await findSensorAggregate();
        expect(sensorAggregates.length).to.be.equal(2);
    });
});

import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import {handler} from "index";
import {getMongoClient, findSensorAggregate, findVirtualSensor} from "services/mongodb";
import {setInstance} from "services/dispatcher";
import {getEventFromObject} from "../mocks";
import {SENSOR_AGGREGATES_COLLECTION_NAME, VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME} from "config";

const sensor = {
    description: "A description",
    name: "Sito with sensors",
    virtual: false,
    formulas: [{
        formula: "IT0000011",
        variables: ["IT0000011"],
        measurementType: ["activeEnergy"],
        start: "1970-01-01T00:00:00Z",
        end: "2170-01-01T00:00:00Z"
    }, {
        formula: "ANZ01 + ANZ02",
        variables: ["ANZ01", "ANZ02"],
        measurementType: ["temperature"],
        start: "2011-01-01T00:00:00.000Z",
        end: "2100-01-01T00:00:00.000Z"
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

const sensorAggregateAnz02 = {
    _id: "ANZ02-2016-01-01-reading-temperature",
    day: "2016-01-01",
    sensorId: "ANZ02",
    source: "reading",
    measurementType: "temperature",
    unitOfMeasurement: "°C",
    measurementValues: "432,354,451",
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
        expect(allSensors.length).to.equal(0);
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
            formulas: [{
                formula: "IT0000011",
                measurementType: ["activeEnergy"],
                variables: ["IT0000011"],
                start: "1970-01-01T00:00:00Z",
                end: "2170-01-01T00:00:00Z"
            }, {
                formula: "ANZ01 + ANZ02",
                measurementType: ["temperature"],
                "variables": ["ANZ01", "ANZ02"],
                start: "2011-01-01T00:00:00.000Z",
                end: "2100-01-01T00:00:00.000Z"
            }],
            measurementType: ["activeEnergy", "temperature"],
            "variables": ["IT0000011", "ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(allSensors.length).to.equal(1);

        expect(allSensors[0]).to.deep.equal(expected);
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
            formulas: [{
                formula: "IT0000011",
                measurementType: ["activeEnergy"],
                variables: ["IT0000011"],
                start: "1970-01-01T00:00:00Z",
                end: "2170-01-01T00:00:00Z"
            }, {
                "formula": "ANZ01 + ANZ02",
                "measurementType": ["temperature"],
                "variables": ["ANZ01", "ANZ02"],
                "start": "2011-01-01T00:00:00.000Z",
                "end": "2100-01-01T00:00:00.000Z"
            }],
            measurementType: ["activeEnergy", "temperature"],
            "variables": ["IT0000011", "ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(allSensors.length).to.equal(1);

        expect(allSensors[0]).to.deep.equal(expected);
    });

    it("receive an already saved virtual sensor and upsert [CASE 1]", async () => {

        await db.collection(SENSOR_AGGREGATES_COLLECTION_NAME).insert(sensorAggregateVirtual);
        await db.collection(SENSOR_AGGREGATES_COLLECTION_NAME).insert(sensorAggregateAnz01);

        const dispatcher = setInstance(sinon.spy());

        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                formula: "ANZ01",
                measurementType: ["activeEnergy", "temperature"],
                variables: ["ANZ01"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
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
                formula: "ANZ01",
                measurementType: ["activeEnergy", "temperature"],
                variables: ["ANZ01"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
            }],
            measurementType: ["activeEnergy", "temperature"],
            "variables": ["ANZ01"]
        };

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const virtualSensors = await findVirtualSensor({_id: "VIRTUAL01"});
        expect(virtualSensors.length).to.be.equal(1);

        const sensorAggregates = await findSensorAggregate();
        expect(sensorAggregates.length).to.be.equal(2);

        expect(virtualSensors[0]).to.deep.equal(expected);

        expect(dispatcher).to.have.been.calledTrice;

        expect(dispatcher.firstCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:15:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "808"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.secondCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:20:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "600"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.thirdCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:25:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "500"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });
    });

    it("receive an already saved virtual sensor and upsert [CASE 3: changed formula]", async () => {

        const dispatcher = setInstance(sinon.spy());

        await db.collection(SENSOR_AGGREGATES_COLLECTION_NAME).insert(sensorAggregateAnz02);

        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                formula: "ANZ01+ANZ02",
                aggregationType: "mean",
                measurementType: ["temperature"],
                variables: ["ANZ01", "ANZ02"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
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
                formula: "ANZ01+ANZ02",
                aggregationType: "mean",
                measurementType: ["temperature"],
                variables: ["ANZ01", "ANZ02"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
            }],
            measurementType: ["temperature"],
            "variables": ["ANZ01", "ANZ02"]
        };

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const sensorAggregates = await findSensorAggregate();
        expect(sensorAggregates.length).to.be.equal(3);

        const virtualSensors = await findVirtualSensor({_id: "VIRTUAL01"});

        expect(virtualSensors[0]).to.deep.equal(expected);

        expect(dispatcher.callCount).to.be.equal(6);

        expect(dispatcher.firstCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:15:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "808"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.secondCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:20:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "600"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.thirdCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:25:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "500"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(3)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:15:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "432"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(4)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:20:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "354"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(5)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:25:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "451"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

    });

    it("receive an already saved virtual sensor and upsert [CASE 4: changed formula aggregationType]", async () => {

        const dispatcher = setInstance(sinon.spy());

        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                formula: "ANZ01+ANZ02",
                aggregationType: "sum",
                measurementType: ["temperature"],
                variables: ["ANZ01", "ANZ02"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
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
                formula: "ANZ01+ANZ02",
                aggregationType: "sum",
                measurementType: ["temperature"],
                variables: ["ANZ01", "ANZ02"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
            }],
            measurementType: ["temperature"],
            "variables": ["ANZ01", "ANZ02"]
        };

        await handler(event, context);

        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const sensorAggregates = await findSensorAggregate();
        expect(sensorAggregates.length).to.be.equal(3);

        const virtualSensors = await findVirtualSensor({_id: "VIRTUAL01"});

        expect(virtualSensors[0]).to.deep.equal(expected);

        expect(dispatcher.callCount).to.be.equal(6);

        expect(dispatcher.firstCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:15:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "808"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.secondCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:20:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "600"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.thirdCall).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:25:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "500"
                }],
                sensorId: "ANZ01",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(3)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:15:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "432"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(4)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:20:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "354"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

        expect(dispatcher.getCall(5)).to.have.been.calledWith("element inserted in collection readings", {
            element: {
                date: "2016-01-28T00:25:00.000Z",
                measurements: [{
                    type: "temperature",
                    unitOfMeasurement: "°C",
                    value: "451"
                }],
                sensorId: "ANZ02",
                source: "reading"
            }
        });

    });
});

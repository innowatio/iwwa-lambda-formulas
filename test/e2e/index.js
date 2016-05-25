import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import {handler} from "index";
import {getMongoClient, findVirtualSensor} from "services/mongodb";
import {getEventFromObject} from "../mocks";
import {VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME} from "config";

const sensor = {
    _id: "_id",
    description: "a description",
    name: "Sensore ambientale",
    type: "ZTHL",
    virtual: false,
    formulas: [{
        formula: "IT001E00088487",
        measurementType: ["activeEnergy", "temperature"],
        start: "1970-01-01T00:00:00Z",
        end: "2170-01-01T00:00:00Z"
    }, {
        formula: "ANZ01 + ANZ02",
        measurementType: ["temperature"],
        start: "2011-01-01T00:00:00.000Z",
        end: "2100-01-01T00:00:00.000Z"
    }],
    siteId: "site1",
    userId: "user1"
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
        await db.createCollection(VIRTUAL_SENSORS_FORMULAS_COLLECTION_NAME);
    });

    after(async () => {
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
                id: "ANZ01"
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
                id: "ANZ01"
            },
            type: "element inserted in collection sensors"
        });
        const expected = {
            _id: "_id",
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                variables: ["IT001E00088487"],
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
            "variables": ["IT001E00088487", "ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({_id: "_id"});
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
                id: "ANZ01"
            },
            type: "element inserted in collection sensors"
        });
        const expected = {
            _id: "_id",
            formulas: [{
                formula: "IT001E00088487",
                measurementType: ["activeEnergy", "temperature"],
                variables: ["IT001E00088487"],
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
            "variables": ["IT001E00088487", "ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({_id: "_id"});
        expect(allSensors.length).to.equal(1);

        expect(allSensors[0]).to.deep.equal(expected);
    });

    it("receive an already saved virtual sensor and upsert [CASE 1]", async () => {
        const virtualSensor = {
            ...sensor,
            virtual: true,
            formulas: [{
                formula: "ANZ01 + ANZ02",
                measurementType: ["activeEnergy", "temperature"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
            }]
        };
        const event = getEventFromObject({
            id: "eventId",
            data: {
                element: virtualSensor,
                id: "ANZ01"
            },
            type: "element inserted in collection sensors"
        });
        const expected = {
            _id: "_id",
            formulas: [{
                formula: "ANZ01 + ANZ02",
                measurementType: ["activeEnergy", "temperature"],
                variables: ["ANZ01", "ANZ02"],
                start: "2016-01-01T00:00:00Z",
                end: "2016-01-02T00:00:00Z"
            }],
            measurementType: ["activeEnergy", "temperature"],
            "variables": ["ANZ01", "ANZ02"]
        };

        await handler(event, context);
        
        expect(context.succeed).to.have.been.calledOnce;
        expect(context.fail).to.not.have.been.calledOnce;

        const allSensors = await findVirtualSensor({_id: "_id"});
        expect(allSensors.length).to.equal(1);

        expect(allSensors[0]).to.deep.equal(expected);
    });
});

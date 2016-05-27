import {Kinesis} from "aws-sdk";
import getDispatch from "lk-dispatch";

import {
    KINESIS_STREAM,
    KINESIS_PRODUCER_ID
} from "../config";

var dispatcherInstance;

function getInstance () {
    if (!dispatcherInstance) {
        dispatcherInstance = getDispatch({
            kinesisClient: new Kinesis(),
            kinesisStream: KINESIS_STREAM,
            producerId: KINESIS_PRODUCER_ID
        });
    }
    return dispatcherInstance;
}

export function dispatch (eventType, eventData, eventOptions) {
    getInstance().dispatch(eventType, eventData, eventOptions);
}
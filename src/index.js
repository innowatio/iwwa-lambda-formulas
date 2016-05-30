import "babel-polyfill";
import router from "kinesis-router";

import pipeline from "./pipeline";

export const handler = router()
    .on("element inserted in collection sensors", pipeline)
    .on("element replaced in collection sensors", pipeline);

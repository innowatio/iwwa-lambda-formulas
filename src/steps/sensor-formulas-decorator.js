import uniq from "lodash.uniq";

export function decorateSensorFormula (sensor) {
    var decoratedSensorFormula = {
        ...sensor
    };

    decoratedSensorFormula.formulas = sensor.formulas;

    decoratedSensorFormula.sensorsIds = uniq(sensor.formulas.reduce((prev, formula) => {
        return [...prev, ...formula.variables.map(x => x.sensorId)];
    }, []));

    return decoratedSensorFormula;
}

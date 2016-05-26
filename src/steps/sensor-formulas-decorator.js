import flattendeep from "lodash.flattendeep";
import uniq from "lodash.uniq";

export function retriveFormulaMeasurementType (formulas) {
    return uniq(flattendeep(formulas.map(formula => {
        return formula.measurementType;
    }))).filter(x => x);
}

export function decorateSensor (sensor) {
    var decoratedSensor = {
        ...sensor
    };
    decoratedSensor.measurementType = retriveFormulaMeasurementType(sensor.formulas);
    decoratedSensor.formulas = sensor.formulas;
    decoratedSensor.variables = uniq(sensor.formulas.reduce((prev, formula) => {
        return [...prev, ...formula.variables];
    }, []));
    return decoratedSensor;
}
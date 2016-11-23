import flattendeep from "lodash.flattendeep";
import uniq from "lodash.uniq";

export function retriveFormulaMeasurementType (formulas) {
    return uniq(flattendeep(formulas.map(formula => {
        return formula.measurementType;
    }))).filter(x => x);
}

export function decorateSensorFormula (sensorFormula) {
    var decoratedSensorFormula = {
        ...sensorFormula
    };
    decoratedSensorFormula.measurementType = retriveFormulaMeasurementType(sensorFormula.formulas);
    decoratedSensorFormula.formulas = sensorFormula.formulas;
    decoratedSensorFormula.variables = uniq(sensorFormula.formulas.reduce((prev, formula) => {
        return [...prev, ...formula.variables];
    }, []));
    return decoratedSensorFormula;
}

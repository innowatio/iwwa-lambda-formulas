import flattendeep from "lodash.flattendeep";
import uniq from "lodash.uniq";

import {parse} from "mathjs";

function mapNodeArgs (node) {
    if (node.args) {
        return node.args.map((arg) => {
            if (arg.content) {
                if (arg.content.name) {
                    return arg.content.name;
                } else {
                    return mapNodeArgs(arg.content);
                }
            } else {
                if (arg.name) {
                    return arg.name;
                } else {
                    return mapNodeArgs(arg);
                }
            }
        });
    } else if (node.name) {
        return [node.name];
    }
}

export function retriveFormulaVariables (formula) {
    var node = parse(formula);
    return uniq(flattendeep(mapNodeArgs(node))).filter(x => x);
}

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
    decoratedSensor.formulas = sensor.formulas.map(formula => {
        return {
            ...formula,
            variables: retriveFormulaVariables(formula.formula)
        };
    });
    decoratedSensor.variables = sensor.formulas.reduce((prev, formula) => {
        return [...prev, ...retriveFormulaVariables(formula.formula)];
    }, []);
    return decoratedSensor;
}
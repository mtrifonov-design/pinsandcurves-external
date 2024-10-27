import externalFunctions from "./InterpolationFunctionExternalFunctions";

const ACCESSIBLE_EXTERNAL_SCOPE_SCHEMA = {
    functions: externalFunctions,
    variables:{
        absoluteTime:0.5,
        relativeTime: 0.5,
        previousPinValue:0,
        previousPinTime:0,
        currentPinValue:1,
        currentPinTime:1,
        PI: Math.PI,
    },
}

export default ACCESSIBLE_EXTERNAL_SCOPE_SCHEMA;
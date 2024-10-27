import type { Curve } from '../../External/Types/Project';
import parseToJSFunction from "../YevaScript/parseToJSFunction";


type CachedFunction = {
    functionString: string;
    cached: Function;
};

type CachedFunctions = {
    [key: string]: CachedFunction;
};

const ERROR_CACHED = parseToJSFunction({},`->0;`);

const cachedFunctions : CachedFunctions = {};

const getCachedFunction = (signalId : string, currentPinId: string, curve : Curve, AccessibleExternalScope : any) : Function => {
    const key = `${signalId}-${currentPinId}-${curve.functionString}`;
    const result = cachedFunctions[key];

    if (result === undefined ||  result.functionString !== curve.functionString) {
        // A function has been cached for this key, but the function string has changed
        // We need to cache a new function

        const error = curve.error;
        // check if the uncached function has an error
        if (error !== "") {
            // if there is an error, cache an error function
            cachedFunctions[key] = {
                functionString: curve.functionString,
                cached: ERROR_CACHED,
            };
        } else {
            // if there is no error, cache the function
            const functionString = curve.functionString;
            const cachedFunction = parseToJSFunction(AccessibleExternalScope, functionString);
            cachedFunctions[key] = {
                functionString: functionString,
                cached: cachedFunction,
            };
        }
    }

    return cachedFunctions[key].cached;
}

export default getCachedFunction;

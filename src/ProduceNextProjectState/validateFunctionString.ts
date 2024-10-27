import parseAndEvaluate from "../YevaScript/parseAndEvaluate";
import ACCESSIBLE_EXTERNAL_SCOPE_SCHEMA from "./AccessibleExternalScopeSchema"
import type { SignalData } from "../../External/Types/Project"

const validateFunctionString = (signalData: SignalData, signalId: string, functionString: string) => {
    const validateFunctionString = (functionString : string) => {
        try {
            const value = parseAndEvaluate(functionString, ACCESSIBLE_EXTERNAL_SCOPE_SCHEMA, {
                signalId, 
                signalData, 
                visitedSignals:[signalId],
                time: 0.5,
                pinWindow: {
                    previousPinTime: 0,
                    previousPinValue: 0,
                    currentPinTime: 1,
                    currentPinValue: 1,
                    currentCurve: {
                            functionString: functionString,
                            error: "",
                        },
                }
                
            });
            if (value === undefined || typeof value !== "number") {
                throw new Error("Runtime Error: Function must return a number");
            }
            return "";
        } catch(e : any) {
            console.log(e);
            return e.message;
        }
    };
    return validateFunctionString(functionString);
};

export default validateFunctionString;
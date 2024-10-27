
import type { PinWindow } from "./Types";
import type { SignalData } from "../../External/Types/Project";

const computePinWindow = (signalData : SignalData, signalId : string, range: [number,number], time : number) : PinWindow => {
    // Create a deep clone of the signalData object, as to not mutate the original object
    const signal = signalData[signalId];

    // Clone the pinTimes and pinValues objects, as to not mutate the original objects
    const pinTimes = {...signal.pinTimes};
    const pinValues = {...signal.pinValues};

    // Sort the pinTimes object by time
    // and add a startPin and endPin to the beginning and end of the array,
    // so that there is always at least one interval spanning the entire time range
    const orderedPinTimeArray = Object.entries(pinTimes).sort((a,b) => a[1] - b[1]);
    orderedPinTimeArray.unshift(["startPin",-1]);
    orderedPinTimeArray.push(["endPin",2]);

    pinTimes["startPin"] = -1;
    pinTimes["endPin"] = 2;
    pinValues["startPin"] = 0;
    pinValues["endPin"] = 0;

    // iterate through the intervals partitioning the time range
    // and find the interval that contains the time
    let previousPinId = "";
    let currentPinId = "";
    for (let i = 0; i < orderedPinTimeArray.length - 2; i++) {
        const [localPreviousPinId, localPreviousPinTime] = orderedPinTimeArray[i];
        const [localCurrentPinId, localCurrentPinTime] = orderedPinTimeArray[i+1];
        if (localPreviousPinTime < time && time <= localCurrentPinTime) {
            previousPinId = localPreviousPinId;
            currentPinId = localCurrentPinId;
            break;
        }
    }

    // find the curve that corresponds to the currentPinId & clone
    let currentCurve = {};
    if (currentPinId === "endPin") {
        currentCurve = {
            functionString: "-> 0;",
            error: "",
        };
    } else {
        currentCurve = {...signal.curves[currentPinId]};
    }

    const pinWindow : PinWindow = {
        currentPinId: currentPinId,
        currentPinTime: pinTimes[currentPinId],
        currentPinValue: pinValues[currentPinId] * (range[1] - range[0]) + range[0],
        currentCurve: currentCurve,
        previousPinTime: pinTimes[previousPinId],
        previousPinValue: pinValues[previousPinId]* (range[1] - range[0]) + range[0],
    };
    return pinWindow;
}

export default computePinWindow;
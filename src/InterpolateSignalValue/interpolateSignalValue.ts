import { SignalData, Curve } from '../../External/Types/Project';
import getAccessibleExternalScope from './GetAccessibleExternalScope';
import getCachedFunction from './GetCachedFunction';
import {clamp} from './Utils';
import computePinWindow from './ComputePinWindow';

const interpolateSignalValue = (signalData : SignalData, signalId : string, time : number, visitedSignals : string[] = []) => { 
    if (visitedSignals.includes(signalId)) {
        throw new Error("Circular reference detected");
    } else {
        visitedSignals.push(signalId);
    };

    const range = signalData[signalId].range;
    const pinWindow = computePinWindow(signalData,signalId,range,time);
    const AccessibleExternalScope = getAccessibleExternalScope(pinWindow, time);
    const cachedFunction = getCachedFunction(signalId, pinWindow.currentPinId, pinWindow.currentCurve, AccessibleExternalScope);



    const interpolatedValue = cachedFunction(
        AccessibleExternalScope.functions,
        AccessibleExternalScope.variables, {
            signalData, 
            signalId, 
            visitedSignals,
            time,
            pinWindow: {
                previousPinTime: pinWindow.previousPinTime,
                previousPinValue: pinWindow.previousPinValue,
                currentPinTime: pinWindow.currentPinTime,
                currentPinValue: pinWindow.currentPinValue,
                currentCurve: pinWindow.currentCurve,
            },
    });
    
    return isNaN(interpolatedValue) ? 0 : interpolatedValue;
};

export default interpolateSignalValue;
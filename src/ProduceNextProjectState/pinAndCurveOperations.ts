
import type { Curve, ProjectState } from "../../External/Types/Project";
import validateFunctionString from "./validateFunctionString";
import { produce } from "immer";

const createPin = ({signalId,pinId,value,time,functionString}:{signalId:string,pinId:string,value:number,time:number,functionString: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.signalData[signalId].pinValues[pinId] = value;
        projectDraft.signalData[signalId].pinTimes[pinId] = time;
        const error = validateFunctionString(projectDraft.signalData, signalId, functionString);
        const curve = {
            error,
            functionString: functionString,
        } 
        projectDraft.signalData[signalId].curves[pinId] = curve;
        projectDraft.signalData[signalId].pinIds.push(pinId);
    });
};

const updatePinValue = ({signalId,pinId,pinValue}:{signalId: string,pinId:string, pinValue: number}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.signalData[signalId].pinValues[pinId] = pinValue;
    });
};
const updatePinTime = ({signalId,pinId,pinTime}:{signalId:string,pinId:string,pinTime:number}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.signalData[signalId].pinTimes[pinId] = pinTime;
    });
};
const updateCurve = ({signalId,pinId,functionString}:{signalId:string,pinId:string,functionString:string}) => {
    return produce((projectDraft : ProjectState) => {
        const error = validateFunctionString(projectDraft.signalData, signalId, functionString);
        const curve = {
            error,
            functionString: functionString,
        } 
        projectDraft.signalData[signalId].curves[pinId] = curve;
    });
};

const deletePin = ({signalId,pinId}:{signalId:string,pinId:string}) => {
    console.log("deletePin",signalId,pinId);
    return produce((projectDraft : ProjectState) => {
        delete projectDraft.signalData[signalId].pinValues[pinId];
        delete projectDraft.signalData[signalId].pinTimes[pinId];
        delete projectDraft.signalData[signalId].curves[pinId];
        projectDraft.signalData[signalId].pinIds = projectDraft.signalData[signalId].pinIds.filter(id => id !== pinId);
    });
};

const updateRange = ({signalId,range}:{signalId:string,range:[number,number]}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.signalData[signalId].range = range;
    });
}

export default { createPin, updatePinValue, updateCurve, updatePinTime, deletePin, updateRange };
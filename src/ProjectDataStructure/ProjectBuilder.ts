import {     
    OrgData,
    TimelineData,
    Curve,
    DiscreteSignal,
    ContinuousSignal, 
    SignalData,
    PinsAndCurvesProject,
    Signal
} from "./Project";

import emptyProject from "./EmptyProject";

function generateId() {
    return Math.random().toString(36).substring(7);
}

class ProjectBuilder {
    _project : PinsAndCurvesProject = emptyProject();
    constructor() {};
    addDiscreteSignal(signalId: string, signalName: string)  {
        this._project.orgData.signalIds.push(signalId);
        this._project.orgData.signalNames[signalId] = signalName;
        this._project.orgData.signalTypes[signalId] = 'discrete';
        this._project.signalData[signalId] = {
            id: signalId,
            type: 'discrete',
            pinIds: [],
            pinTimes: {},
            pinValues: {},
        };
    }
    addContinuousSignal(signalId: string, signalName: string, range: [number,number]) {
        this._project.orgData.signalIds.push(signalId);
        this._project.orgData.signalNames[signalId] = signalName;
        this._project.orgData.signalTypes[signalId] = 'continuous';
        this._project.signalData[signalId] = {
            id: signalId,
            type: 'continuous',
            range: range,
            pinIds: [],
            pinTimes: {},
            pinValues: {},
            curves: {},
        };
    }
    addPin(signalId: string, pinTime: number, pinValue: number | string, curve?: string) {
        const signal = this._project.signalData[signalId] as Signal;
        const pinId = generateId();
        this._project.orgData.pinIds.push(pinId);
        this._project.orgData.signalIdByPinId[pinId] = signalId;
        if (signal.type === 'continuous') {
            signal.pinIds.push(pinId);
            signal.pinTimes[pinId] = pinTime;
            if (typeof pinValue !== 'number') throw new Error('Continuous signal pin value must be a number');
            signal.pinValues[pinId] = pinValue as number;
            if (!curve) throw new Error('Continuous signal pin must have a curve');
            if (curve) {
                signal.curves[pinId] = curve;
            }
        }
        if (signal.type === 'discrete') {
            signal.pinIds.push(pinId);
            signal.pinTimes[pinId] = pinTime;
            if (typeof pinValue !== 'string') throw new Error('Discrete signal pin value must be a string');
            signal.pinValues[pinId] = pinValue as string;
        }
    }
    setTimelineData(numberOfFrames: number, framesPerSecond: number, playheadPosition: number) {
        this._project.timelineData = {
            numberOfFrames,
            framesPerSecond,
            playheadPosition
        }
    }
    setSignalActiveStatus(signalId: string, active: boolean) {
        if (active) {
            this._project.orgData.activeSignalIds.push(signalId);
        } else {
            this._project.orgData.activeSignalIds = this._project.orgData.activeSignalIds.filter(id => id !== signalId);
        }
    }
    getProject() {
        return this._project;
    }
}

export default ProjectBuilder;
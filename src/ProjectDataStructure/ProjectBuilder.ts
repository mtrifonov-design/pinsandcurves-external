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

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

class ProjectBuilder {
    _project : PinsAndCurvesProject = emptyProject();
    constructor() {};

    setName(name: string) {
        this._project.metaData.name = name;
    }


    addStaticStringSignal(signalId: string, signalName: string, staticValue: string) {
        this._project.orgData.signalIds.push(signalId);
        this._project.orgData.signalNames[signalId] = signalName;
        this._project.orgData.signalTypes[signalId] = 'discrete';
        this._project.signalData[signalId] = {
            id: signalId,
            type: 'discrete',
            pinIds: [],
            pinTimes: {},
            pinValues: {},
            defaultValue: staticValue,
            isStatic: true,
        };
    }

    addStaticNumberSignal(signalId: string, signalName: string, range:[number,number], staticValue: number) {
        this._project.orgData.signalIds.push(signalId);
        this._project.orgData.signalNames[signalId] = signalName;
        this._project.orgData.signalTypes[signalId] = 'continuous';
        this._project.signalData[signalId] = {
            id: signalId,
            type: 'continuous',
            pinIds: [],
            pinTimes: {},
            pinValues: {},
            defaultValue: staticValue,
            isStatic: true,
            range,
            defaultCurve: 'return easyLinear();',
            curves: {},
        };
    }


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
            defaultValue: 'default value',
            displayValues: true,
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
            defaultCurve: 'return easyLinear();',
            defaultValue: range[0],
        };
    }
    addContinuousBezierSignal(signalId: string, signalName: string, range: [number,number]) {
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
            defaultCurve: 'return bezier();',
            defaultValue: range[0],
            bezierControlPoints: {},
            bezier: true,
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
            if (curve) {
                signal.curves[pinId] = curve;
            } else {
                const defaultCurve = signal.defaultCurve;
                signal.curves[pinId] = defaultCurve;
            }

            if ("bezier" in signal) {
                const numberOfFrames = this._project.timelineData.numberOfFrames;
                const time1 = -5
                const time2 = 5
                const value1 = 0;
                const value2 = 0;
                signal.bezierControlPoints[pinId] = [time1,value1,time2,value2];
            }


        }
        if (signal.type === 'discrete') {
            signal.pinIds.push(pinId);
            signal.pinTimes[pinId] = pinTime;
            if (typeof pinValue !== 'string') throw new Error('Discrete signal pin value must be a string');
            signal.pinValues[pinId] = pinValue as string;
        }
    }
    setTimelineData(numberOfFrames: number, framesPerSecond: number, playheadPosition: number, focusRange?: [number, number]) {
        this._project.timelineData = {
            ...this._project.timelineData,
            numberOfFrames,
            framesPerSecond,
            playheadPosition,
            focusRange: focusRange || this._project.timelineData.focusRange,
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

    addCurveTemplate(curveId: string, curve: Curve) {
        this._project.templateData[curveId] = curve;
    }
}

export default ProjectBuilder;

interface OrgData {
    signalIds: string[];
    pinIds: string[];
    signalIdByPinId: {
        [key: string]: string;
    };
    signalNames: {
        [key: string]: string;
    };
    signalTypes: {
        [key: string]: 'continuous' | 'discrete';
    }
    activeSignalIds: string[];
}

interface TimelineData {
    numberOfFrames: number;
    framesPerSecond: number;
    playheadPosition: number;
    focusRange: [number, number];
    playing: boolean;
    playingTimestamp: number;
}

type Curve = string;

interface TemplateData {
        [curveId: string]: Curve;
}

interface BaseSignal {
    id: string;
    isStatic?: true;
    type: 'continuous' | 'discrete';
    defaultValue: number | string;
    pinIds: string[];
    pinTimes: {
        [pinId: string]: number | undefined;
    };
}

interface ContinuousSignal extends BaseSignal{
    type: 'continuous';
    defaultValue: number;
    range: [number, number];
    pinValues: {
        [pinId: string]: number | undefined;
    };
    curves: {
        [pinId: string]: Curve | undefined;
    };
    defaultCurve: Curve;
}

interface ContinuousBezierSignal extends ContinuousSignal {
    bezier: true;
    bezierControlPoints: {
        [pinId: string]: [
            handle1time: number,
            handle1value: number,
            handle2time: number,
            handle2value: number
        ] | undefined;
    };
    defaultCurve: "return bezier();";
}

interface DiscreteSignal extends BaseSignal{
    type: 'discrete';
    displayValues?: true;
    defaultValue: string;
    pinIds: string[]; // expected to be sorted by pinTime
    pinValues: {
        [pinId: string]: string | undefined;
    };
}

type Signal = ContinuousSignal | DiscreteSignal | ContinuousBezierSignal;

interface SignalData {
    [signalId: string]: ContinuousSignal | DiscreteSignal | ContinuousBezierSignal | undefined;
}

interface PinsAndCurvesProject {
    metaData: {
        name: string;
        pinsAndCurvesVersion: string;
    }
    timelineData: TimelineData;
    orgData: OrgData;
    signalData: SignalData;
    templateData: TemplateData;
}

export type { 
    OrgData,
    TimelineData,
    Curve,
    DiscreteSignal,
    ContinuousSignal, 
    ContinuousBezierSignal,
    SignalData,
    PinsAndCurvesProject,
    Signal
};

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
}

type Curve = string;

interface TemplateData {
        [curveId: string]: Curve;
}

interface ContinuousSignal {
    id: string;
    type: 'continuous';
    range: [number, number];
    pinIds: string[];
    pinTimes: {
        [pinId: string]: number | undefined;
    };
    pinValues: {
        [pinId: string]: number | undefined;
    };
    curves: {
        [pinId: string]: Curve | undefined;
    }
}

interface DiscreteSignal {
    id: string;
    type: 'discrete';
    pinIds: string[];
    pinTimes: {
        [pinId: string]: number | undefined;
    };
    pinValues: {
        [pinId: string]: string | undefined;
    };
}

type Signal = ContinuousSignal | DiscreteSignal;

interface SignalData {
    [signalId: string]: ContinuousSignal | DiscreteSignal | undefined;
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
    SignalData,
    PinsAndCurvesProject,
    Signal
};
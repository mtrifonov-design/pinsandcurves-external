
interface OrgData {
    signalIds: string[];
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
}

interface Curve {
    functionString: string;
    parseError: undefined | string;
}

interface ContinuousSignal {
    id: string;
    type: 'continuous';
    range: [number, number];
    pinIds: string[];
    pinTimes: {
        [pinId: string]: number;
    };
    pinValues: {
        [pinId: string]: number;
    };
    curves: {
        [pinId: string]: Curve;
    }
}

interface DiscreteSignal {
    id: string;
    type: 'discrete';
    pinIds: string[];
    pinTimes: {
        [pinId: string]: number;
    };
    pinValues: {
        [pinId: string]: string;
    };
}

interface SignalData {
    [signalId: string]: ContinuousSignal | DiscreteSignal;
}

interface PinsAndCurvesProject {
    metaData: {
        name: string;
        description: string;
    }
    timelineData: TimelineData;
    orgData: OrgData;
    signalData: SignalData;
}

export type { 
    OrgData,
    TimelineData,
    Curve,
    DiscreteSignal,
    ContinuousSignal, 
    SignalData,
    PinsAndCurvesProject 
};
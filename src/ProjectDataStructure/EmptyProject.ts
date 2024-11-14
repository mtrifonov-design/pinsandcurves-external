import { PinsAndCurvesProject } from "./Project";

const getEmptyProject : () => PinsAndCurvesProject = () => ({
    metaData: {
        name: 'Empty Project',
        pinsAndCurvesVersion: '0.0.1'
    },
    orgData: {
        signalIds: [],
        signalNames: {},
        signalTypes: {},
        activeSignalIds: []
    },
    timelineData: {
        numberOfFrames: 100,
        framesPerSecond: 30,
        playheadPosition: 0
    },
    signalData: {}
    
});

export default getEmptyProject;
import { PinsAndCurvesProject } from "./Project";

const getEmptyProject : () => PinsAndCurvesProject = () => ({
    metaData: {
        name: 'Empty Project',
        pinsAndCurvesVersion: '0.0.1'
    },
    orgData: {
        signalIds: [],
        signalIdByPinId: {},
        pinIds: [],
        signalNames: {},
        signalTypes: {},
        activeSignalIds: []
    },
    timelineData: {
        numberOfFrames: 100,
        framesPerSecond: 30,
        playheadPosition: 0,
        focusRange: [0, 100],
        playing: false,
        playingTimestamp: 0
    },
    signalData: {},
    templateData: {}
    
});

export default getEmptyProject;
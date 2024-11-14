import { ProjectDataStructure } from "..";

type PinsAndCurvesProject = ProjectDataStructure.PinsAndCurvesProject;

const project : PinsAndCurvesProject = {
    metaData: {
        name: 'My Project',
        pinsAndCurvesVersion: '0.0.1'
    },
    orgData: {
        signalIds: ['signal1', 'signal2'],
        signalNames: {
            'signal1': 'Signal 1',
            'signal2': 'Signal 2'
        },
        signalTypes: {
            'signal1': 'continuous',
            'signal2': 'discrete'
        },
        activeSignalIds: ['signal1', 'signal2']
    },
    timelineData: {
        numberOfFrames: 100,
        framesPerSecond: 30,
        playheadPosition: 0
    },
    signalData: {
        'signal1': {
            id: 'signal1',
            type: 'continuous',
            range: [0, 1],
            pinIds: ['pin1', 'pin2'],
            pinTimes: {
                'pin1': 0,
                'pin2': 0
            },
            pinValues: {
                'pin1': 0,
                'pin2': 0
            },
            curves: {
                'pin1': 'curve1',
                'pin2': 'curve2'
            }
        },
        'signal2': {
            id: 'signal2',
            type: 'discrete',
            pinIds: ['pin3', 'pin4'],
            pinTimes: {
                'pin3': 0,
                'pin4': 0
            },
            pinValues: {
                'pin3': 'value1',
                'pin4': 'value2'
            }
        }
    }
};

export default project;
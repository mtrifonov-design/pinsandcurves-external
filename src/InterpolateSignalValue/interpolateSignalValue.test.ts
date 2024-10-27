import interpolateSignalValue from './interpolateSignalValue';
import type { SignalData} from '../Types/Project'; 

describe('interpolateSignalValue', () => {
    it('should interpolate the signal value correctly when no pins exist', () => {
        const signalData : SignalData = {
            'signal1': {
                pinIds: [],
                pinValues: {},
                pinTimes: {},
                curves: {},
                range: [0, 1],
            },
        };

        const signalId = 'signal1';
        const time = 0.5;

        const result = interpolateSignalValue(signalData, signalId, time);

        expect(result).toBe(0);
    });

    it('should detect circular reference', () => {
        const signalData : SignalData = {
            'signal1': {
                pinIds: ["pin1"],
                pinValues: {
                    "pin1": 0,
                },
                pinTimes: {
                    "pin1": 1,
                },
                curves: {
                    "pin1": {
                        functionString: "-> signal('signal1',0);",
                        error: '',
                    },
                },
                range: [0, 1],
            },
        };

        const signalId = 'signal1';
        const time = 0.5;

        expect(() => interpolateSignalValue(signalData, signalId, time,["signal1"])).toThrow('Circular reference detected');
    });

    it('should interpolate the signal value correctly for linear curve', () => {
        const signalData : SignalData = {
            'signal1': {
                pinIds: ["pin0","pin1"],
                pinValues: {
                    "pin0": 0,
                    "pin1": 1,
                },
                pinTimes: {
                    "pin0": 0,
                    "pin1": 1,
                },
                curves: {
                    "pin0": {
                        functionString: "-> 0;",
                        error: '',
                    },
                    "pin1": {
                        functionString: `
                            cpv = currentPinValue;
                            ppv = previousPinValue;
                            -> ppv + (cpv - ppv) * relativeTime;
                        `,
                        error: '',
                    },
                },
                range: [0, 1],
            },
        };

        const signalId = 'signal1';
        const time = 0.5;

        const result = interpolateSignalValue(signalData, signalId, time);

        expect(result).toBe(0.5);
    });
});

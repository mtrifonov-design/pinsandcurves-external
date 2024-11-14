import interpolateSignalValue from './InterpolateSignalValue';
import { ProjectDataStructure } from '..';

type Project = ProjectDataStructure.PinsAndCurvesProject;
const ProjectBuilder = ProjectDataStructure.ProjectBuilder;
type ProjectBuilderType = ProjectDataStructure.ProjectBuilder;

describe('interpolateSignalValue', () => {
    let pb: ProjectBuilderType;

    beforeEach(() => {
        pb = new ProjectBuilder();
        pb.setTimelineData(100, 30, 0);
    });

    test('interpolates a continuous signal correctly within range', () => {
        pb.addContinuousSignal('signal', 'Continuous Signal 1', [0, 100]);
        pb.addPin('signal', 100, 0, 'return 5;');
        const project = pb.getProject();
        const [value, errorLog] = interpolateSignalValue(project, 'signal', 5);
        console.log(value,errorLog)
        expect(value).toBe(5);
        expect(errorLog).toEqual([]);
    });

    test('easyLinear interpolation works', () => {
        pb.addContinuousSignal('signal', 'Continuous Signal 1', [0, 100]);
        pb.addPin('signal', 100, 0, 'return easyLinear();');
        const project = pb.getProject();
        const [value, errorLog] = interpolateSignalValue(project, 'signal', 5);
        expect(errorLog).toEqual([]);
    })

    test('returns minimum value and error if frame is out of range', () => {
        pb.addContinuousSignal('signal', 'Continuous Signal 1', [0, 100]);
        const project = pb.getProject();
        pb.setTimelineData(100, 30, 0);
        expect(() => interpolateSignalValue(project, 'signal', -1)).toThrow("Time out of range");
        expect(() => interpolateSignalValue(project, 'signal', 101)).toThrow("Time out of range");
    });

    test('returns interpolated value and handles NaN errors', () => {
        pb.addContinuousSignal('signal', 'Continuous Signal 1', [0, 100]);
        pb.addPin('signal', 100, 0, 'return NaN;');
        const project = pb.getProject();
        const [value, errorLog] = interpolateSignalValue(project, 'signal', 5);
        expect(value).toBe(0);
        expect(errorLog).toEqual([{ signalId: 'signal', frame: 5, error: 'Interpolated value is NaN' }]);
    });


    test('interpolates a discrete signal correctly', () => {
        pb.addDiscreteSignal('signal', 'Discrete Signal 1');
        pb.addPin('signal', 0, 'A');
        pb.addPin('signal', 10, 'B');
        const project = pb.getProject();
        const [value, errorLog] = interpolateSignalValue(project, 'signal', 5);
        expect(value).toBe('B');
        expect(errorLog).toEqual([]);
    });

    test('returns "END VALUE" if frame exceeds last pin in discrete signal', () => {
        pb.addDiscreteSignal('signal', 'Discrete Signal 1');
        pb.addPin('signal', 0, 'A');
        const project = pb.getProject();
        const [value, errorLog] = interpolateSignalValue(project, 'signal', 100);
        expect(value).toBe('END VALUE');
        expect(errorLog).toEqual([]);
    });


    // test('limits recursion depth in interpolateSignalValue', () => {
    //     expect(() => interpolateSignalValue(project, 'continuousSignal1', 5, 1001)).toThrow("Exceeded maximum iteration count");
    // });
});

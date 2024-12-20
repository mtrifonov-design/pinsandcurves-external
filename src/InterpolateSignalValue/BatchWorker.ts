import interpolateSignalValue from "./InterpolateSignalValue";
import { ProjectDataStructure } from '..';

type Project = ProjectDataStructure.PinsAndCurvesProject;

self.onmessage = (event) => {
    const { id, object } = event.data;
    const { project, signalId, frameArray } = object;

    // Perform the batch interpolation (example logic)
    const result = frameArray.map((frame : number) => interpolateSignalValue(project, signalId, frame));

    // Send the result back to the main thread
    self.postMessage({ id, result });
};


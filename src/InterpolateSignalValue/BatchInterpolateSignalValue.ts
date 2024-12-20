
import { ProjectDataStructure } from '..';
type Project = ProjectDataStructure.PinsAndCurvesProject;

let worker : any;

// Task ID management to handle multiple requests
let taskId = 0;
const taskMap = new Map(); // Maps task IDs to their resolve functions



// Batch interpolation function
function batchInterpolateSignalValue(project: Project, signalId: string, frameArray: number[]) {

    if (!worker) {
        worker = new Worker(new URL('../worker/interpolateSignalValueWorker.js', import.meta.url));
        worker.onmessage = (event : any) => {
            const { id, result } = event.data; // Worker should send back { id, result }
            if (taskMap.has(id)) {
                const resolve = taskMap.get(id);
                resolve(result); // Resolve the promise with the worker's result
                taskMap.delete(id);
            }
        };
    }

    // Generate a unique task ID for this batch
    const id = taskId++;
    // Create a promise to return the worker's result asynchronously
    const resultPromise = new Promise((resolve) => {
        // Store the resolve function to be called when the worker responds
        taskMap.set(id, resolve);

        const object = {project,signalId,frameArray}
        // Post the task to the worker
        worker.postMessage({ id, object }); // Send { id, dataArray } to the worker
    });

    return resultPromise; // Return the promise
}

export default batchInterpolateSignalValue;
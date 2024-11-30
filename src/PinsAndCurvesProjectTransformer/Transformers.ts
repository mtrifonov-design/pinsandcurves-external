import { PinsAndCurvesProjectInstructionTypes, PinsAndCurvesProject } from "./types";
import { ContinuousSignal, DiscreteSignal } from "../ProjectDataStructure";

const generateId = (): string => {
    let id = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 10; i++) {
      id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return id;
  };


type Project = PinsAndCurvesProject;
type InstructionTypes = PinsAndCurvesProjectInstructionTypes;


function addPin(draft: Project, instruction: InstructionTypes['addPin']) {
    const { signalId, pinId, pinTime, pinValue, functionString } = instruction;
    const signal = draft.signalData[signalId];
    if (!signal) throw new Error(`Signal with id ${signalId} not found`);
    const signalType = signal.type;
    if (signalType === 'continuous' && typeof pinValue !== 'number') throw new Error(`Pin value must be a number for continuous signals`);
    if (signalType === 'discrete' && typeof pinValue !== 'string') throw new Error(`Pin value must be a string for discrete signals`);
    // check if pin id already exists on any signal
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        if (signal.pinIds.includes(pinId)) throw new Error(`Pin with id ${pinId} already exists`);
    }
    // check if pin time is unique within the current signal
    if (Object.values(signal.pinTimes).includes(pinTime)) throw new Error(`Pin time must be unique within the signal`);
    // make sure that pin Time is within range
    const numberOfFrames = draft.timelineData.numberOfFrames;
    if (pinTime < 0 || pinTime > numberOfFrames) throw new Error(`Pin time must be between 0 and ${numberOfFrames}`);
    // make sure that value is within range for continuous signals
    if (signalType === 'continuous') {
        const [min, max] = signal.range;
        if (pinValue as number < min || pinValue as number > max) throw new Error(`Pin value must be between ${min} and ${max}`);
        if (!functionString) throw new Error(`Curve is required for continuous signals`);
    }

    signal.pinIds.push(pinId);
    signal.pinTimes[pinId] = pinTime;
    signal.pinValues[pinId] = pinValue;
    if (signalType === 'continuous') signal.curves[pinId] = functionString;
}

function deletePin(draft: Project, instruction: InstructionTypes['deletePin']) {
    const { pinId } = instruction;
    let found = false;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        const index = signal.pinIds.indexOf(pinId);
        if (index !== -1) {
            signal.pinIds.splice(index, 1);
            delete signal.pinTimes[pinId];
            delete signal.pinValues[pinId];
            if (signal.type === 'continuous') delete signal.curves[pinId];
            found = true;
            break;
        }
    }
    if (!found) throw new Error(`Pin with id ${pinId} not found`);
}

function updatePinTime(draft: Project, instruction: InstructionTypes['updatePinTime']) {
    const { pinId, pinTime } = instruction;

    
    // check that pin time is within range
    const numberOfFrames = draft.timelineData.numberOfFrames;
    if (pinTime < 0 || pinTime > numberOfFrames) throw new Error(`Pin time must be between 0 and ${numberOfFrames}`);

    let found = false;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        if (signal.pinIds.includes(pinId)) {
            signal.pinTimes[pinId] = pinTime;
            found = true;
            break;
        }
    }
    if (!found) throw new Error(`Pin with id ${pinId} not found`);
}

function updatePins(draft: Project, instruction: InstructionTypes['updatePins']) {}



function updatePinValue(draft: Project, instruction: InstructionTypes['updatePinValue']) {
    const { pinId, pinValue } = instruction;
    let found = false;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        if (signal.pinIds.includes(pinId)) {
            if (signal.type === 'continuous' && typeof pinValue !== 'number') throw new Error(`Pin value must be a number for continuous signals`);
            if (signal.type === 'discrete' && typeof pinValue !== 'string') throw new Error(`Pin value must be a string for discrete signals`);

            if (signal.type === 'continuous') {
                const [min, max] = signal.range;
                if (pinValue as number < min || pinValue as number > max) throw new Error(`Pin value must be between ${min} and ${max}`);
            }
            signal.pinValues[pinId] = pinValue;
            found = true;
            break;
        }
    }
    if (!found) throw new Error(`Pin with id ${pinId} not found`);
}

function updateCurve(draft: Project, instruction: InstructionTypes['updateCurve']) {
    const { pinId, functionString } = instruction;
    let found = false;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        if (signal.type === 'discrete') continue;
        if (signal.pinIds.includes(pinId)) {
            signal.curves[pinId] = functionString;
            found = true;
            break;
        }
    }
    if (!found) throw new Error(`Pin with id ${pinId} not found`);
}

function createSignal(draft: Project, instruction: InstructionTypes['createSignal']) {
    const { signalId, signalType, signalName, range } = instruction;
    if (draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} already exists`);
    if (signalType !== 'continuous' && signalType !== 'discrete') throw new Error(`Signal type must be continuous or discrete`);
    let signal;
    if (signalType === 'continuous') {
        if (!range) throw new Error(`Range is required for continuous signals`);
        const [min, max] = range;
        if (min >= max) throw new Error(`Min value must be less than max value`);
        signal = {
            id: signalId,
            type: signalType,
            range,
            pinIds: [],
            pinTimes: {},
            pinValues: {},
            curves: {},
        }
    }
    if (signalType === 'discrete') {
        signal = {
            id: signalId,
            type: signalType,
            pinIds: [],
            pinTimes: {},
            pinValues: {},
        }
    }
    draft.signalData[signalId] = signal;
    draft.orgData.signalIds.push(signalId);
    draft.orgData.signalNames[signalId] = signalName;
    draft.orgData.signalTypes[signalId] = signalType;
    draft.orgData.activeSignalIds.push(signalId);
}

function deleteSignal(draft: Project, instruction: InstructionTypes['deleteSignal']) {
    const { signalId } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    delete draft.signalData[signalId];
    draft.orgData.signalIds = draft.orgData.signalIds.filter(id => id !== signalId);
    delete draft.orgData.signalNames[signalId];
    draft.orgData.activeSignalIds = draft.orgData.activeSignalIds.filter(id => id !== signalId);
}

function updateSignalName(draft: Project, instruction: InstructionTypes['updateSignalName']) {
    const { signalId, signalName } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    draft.orgData.signalNames[signalId] = signalName;
}

function updateSignalRange(draft: Project, instruction: InstructionTypes['updateSignalRange']) {
    const { signalId, range } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    if ((draft.signalData[signalId] as ContinuousSignal | DiscreteSignal).type !== 'continuous') throw new Error(`Range can only be updated for continuous signals`);
    const [min, max] = range;
    if (min >= max) throw new Error(`Min value must be less than max value`);
    (draft.signalData[signalId] as ContinuousSignal).range = range;
}

function updateSignalIndex(draft: Project, instruction: InstructionTypes['updateSignalIndex']) {
    const { signalId, index } = instruction;
    const signalIds = draft.orgData.signalIds;
    const currentIndex = signalIds.indexOf(signalId);
    if (currentIndex === -1) throw new Error(`Signal with id ${signalId} not found`);
    signalIds.splice(currentIndex, 1);
    signalIds.splice(index, 0, signalId);
}

function updateSignalActiveStatus(draft: Project, instruction: InstructionTypes['updateSignalActiveStatus']) {
    const { signalId, active } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    const activeSignalIds = draft.orgData.activeSignalIds;
    const index = activeSignalIds.indexOf(signalId);
    if (active && index === -1) {
        activeSignalIds.push(signalId);
    }
    if (!active && index !== -1) {
        activeSignalIds.splice(index, 1);
    }
}


function updateFramesPerSecond(draft: Project, instruction: InstructionTypes['updateFramesPerSecond']) {
    const { framesPerSecond } = instruction;
    if (framesPerSecond <= 0) throw new Error(`Frames per second must be greater than 0`);
    draft.timelineData.framesPerSecond = framesPerSecond;
}

function updatePlayheadPosition(draft: Project, instruction: InstructionTypes['updatePlayheadPosition']) {
    const { playheadPosition } = instruction;
    if (playheadPosition < 0 || playheadPosition > draft.timelineData.numberOfFrames) throw new Error(`Playhead position must be between 0 and ${draft.timelineData.numberOfFrames}`);
    draft.timelineData.playheadPosition = playheadPosition;
}

function updateNumberOfFrames(draft: Project, instruction: InstructionTypes['updateNumberOfFrames']) {
    const { numberOfFrames } = instruction;
    if (numberOfFrames <= 0) throw new Error(`Number of frames must be greater than 0`);
    draft.timelineData.numberOfFrames = numberOfFrames;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        for (const pinId of signal.pinIds) {
            if (signal.pinTimes[pinId] as number > numberOfFrames) {
                deletePin(draft, { type: 'deletePin', pinId });
            }
        }
    }
}

function updateProjectName(draft: Project, instruction: InstructionTypes['updateProjectName']) {
    const { projectName } = instruction;
    draft.metaData.name = projectName;
}

export {
    addPin,
    deletePin,
    updatePinTime,
    updatePinValue,
    updateCurve,
    createSignal,
    deleteSignal,
    updateSignalName,
    updateSignalRange,
    updateSignalIndex,
    updateSignalActiveStatus,
    updateFramesPerSecond,
    updatePlayheadPosition,
    updateNumberOfFrames,
    updateProjectName,
    generateId,
}
import { PinsAndCurvesProjectInstructionTypes, PinsAndCurvesProject } from "./types";
import { ContinuousBezierSignal, ContinuousSignal, DiscreteSignal, Signal } from "../ProjectDataStructure";

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
    const { signalId, pinId, pinTime, pinValue, functionString, bezierControlPoints } = instruction;
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
    
        if ("bezier" in signal) {
            if (!signal.bezierControlPoints) throw new Error(`Bezier control points are required for continuous bezier signals`);
            if (!bezierControlPoints) throw new Error(`Bezier control points are required for continuous bezier signals`);
            signal.bezierControlPoints[pinId] = bezierControlPoints;
        }
    
    }

    
    // push to pin Ids at the appropriate index
    const pinIds = signal.pinIds;
    if (pinIds.length === 0) {
        signal.pinIds.push(pinId);
    } else {
        let index = pinIds.findIndex(id => signal.pinTimes[id] as number >= pinTime);
        if (index === -1) index = pinIds.length;
        signal.pinIds.splice(index, 0, pinId);
    }


    signal.pinTimes[pinId] = pinTime;
    signal.pinValues[pinId] = pinValue;
    if (signalType === 'continuous') signal.curves[pinId] = functionString;
    draft.orgData.pinIds.push(pinId);
    draft.orgData.signalIdByPinId[pinId] = signalId;
}

function deletePin(draft: Project, instruction: InstructionTypes['deletePin']) {
    const { pinId } = instruction;
    // console.log(pinId);
    let found = false;
    for (const signalId in draft.signalData) {
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal | ContinuousBezierSignal;
        const index = signal.pinIds.indexOf(pinId);
        if (index !== -1) {
            signal.pinIds.splice(index, 1);
            delete signal.pinTimes[pinId];
            delete signal.pinValues[pinId];
            if (signal.type === 'continuous') {
                delete signal.curves[pinId];
                if ("bezier" in signal) {
                    delete signal.bezierControlPoints[pinId];
                }
            }

            found = true;
            break;
        }
    }
    if (!found) throw new Error(`Pin with id ${pinId} not found`);
    draft.orgData.pinIds = draft.orgData.pinIds.filter(id => id !== pinId);
    delete draft.orgData.signalIdByPinId[pinId];
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
            
            // reorder pinIds
            const pinIds = signal.pinIds;
            const index = pinIds.indexOf(pinId);
            pinIds.splice(index, 1);
            let newIndex = pinIds.findIndex(id => signal.pinTimes[id] as number >= pinTime);
            if (newIndex === -1) newIndex = pinIds.length;
            pinIds.splice(newIndex, 0, pinId);

            found = true;
            break;
        }
    }




    if (!found) throw new Error(`Pin with id ${pinId} not found`);
}

function updatePins(draft: Project, instruction: InstructionTypes['updatePins']) {
    const { pins } = instruction;
    for (const pin of pins) {
        const { pinId, pinTime, pinValue, functionString } = pin;
        const signalId = draft.orgData.signalIdByPinId[pinId];
        if (!signalId) throw new Error(`Pin with id ${pinId} not found`);
        const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
        if (signal.type === 'continuous' && typeof pinValue !== 'number') throw new Error(`Pin value must be a number for continuous signals`);
        if (signal.type === 'discrete' && typeof pinValue !== 'string') throw new Error(`Pin value must be a string for discrete signals`);
        if (signal.type === 'continuous') {
            const [min, max] = signal.range;
            if (pinValue as number < min || pinValue as number > max) throw new Error(`Pin value must be between ${min} and ${max}`);
            if (!functionString) throw new Error(`Curve is required for continuous signals`);
        }
        signal.pinTimes[pinId] = pinTime;
        signal.pinValues[pinId] = pinValue;

        // reorder pinIds
        const pinIds = signal.pinIds;
        const index = pinIds.indexOf(pinId);
        pinIds.splice(index, 1);
        let newIndex = pinIds.findIndex(id => signal.pinTimes[id] as number >= pinTime);
        if (newIndex === -1) newIndex = pinIds.length;
        pinIds.splice(newIndex, 0, pinId);


        if (signal.type === 'continuous') signal.curves[pinId] = functionString;
    }
}

function updatePinBezierControlPoints(draft: Project, instruction: InstructionTypes['updatePinBezierControlPoints']) {
    const { pinId, bezierControlPoints } = instruction;
    const signalId = draft.orgData.signalIdByPinId[pinId];
    if (!signalId) throw new Error(`Pin with id ${pinId} not found`);
    const signal = draft.signalData[signalId] as ContinuousBezierSignal;
    signal.bezierControlPoints[pinId] = bezierControlPoints;
}

function updateSignalDefaultValue(draft: Project, instruction: InstructionTypes['updateSignalDefaultValue']) {
    const { signalId, defaultValue } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    const signal = draft.signalData[signalId] as ContinuousSignal | DiscreteSignal;
    if (signal.type === 'continuous' && typeof defaultValue !== 'number') throw new Error(`Default value must be a number for continuous signals`);
    if (signal.type === 'discrete' && typeof defaultValue !== 'string') throw new Error(`Default value must be a string for discrete signals`);
    signal.defaultValue = defaultValue;
}

function updateSignalDefaultCurve(draft: Project, instruction: InstructionTypes['updateSignalDefaultCurve']) {
    const { signalId, defaultCurve } = instruction;
    if (!draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} not found`);
    const signal = draft.signalData[signalId] as ContinuousSignal | ContinuousBezierSignal;
    signal.defaultCurve = defaultCurve;
}

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
    const { signalId, signalType, signalName, range,
        defaultValue, displayValues, isStatic, bezier, defaultCurve
    } = instruction;
    if (draft.signalData[signalId]) throw new Error(`Signal with id ${signalId} already exists`);
    if (signalType !== 'continuous' && signalType !== 'discrete') throw new Error(`Signal type must be continuous or discrete`);
    let signal;
    if (signalType === 'continuous') {
        if (!range) throw new Error(`Range is required for continuous signals`);
        const [min, max] = range;
        if (min >= max) throw new Error(`Min value must be less than max value`);
        if (typeof defaultValue !== 'number') throw new Error(`Default value must be a number for continuous signals`);
        if (!defaultCurve) throw new Error(`Default curve is required for continuous signals`);

        if (bezier) {

            signal= {
                id: signalId,
                type: signalType,
                range,
                defaultValue,
                isStatic,
                bezier: true,
                bezierControlPoints: {},
                defaultCurve,
                pinIds: [],
                pinTimes: {},
                pinValues: {},
                curves: {},
            } as ContinuousBezierSignal;
        } else {
            signal = {
                id: signalId,
                type: signalType,
                range,
                defaultValue,
                isStatic,
                defaultCurve,
                pinIds: [],
                pinTimes: {},
                pinValues: {},
                curves: {},
            } as ContinuousSignal;
        }

    }
    if (signalType === 'discrete') {
        if (typeof defaultValue !== 'string') throw new Error(`Default value must be a string for discrete signals`);
        
        signal = {
            id: signalId,
            type: signalType,
            pinIds: [],
            defaultValue,
            displayValues,
            isStatic,
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
    const pinIds = (draft.signalData[signalId] as Signal).pinIds;
    pinIds.forEach(pinId => delete draft.orgData.signalIdByPinId[pinId]);
    pinIds.forEach(pinId => draft.orgData.pinIds = draft.orgData.pinIds.filter(id => id !== pinId));

    delete draft.signalData[signalId];
    draft.orgData.signalIds = draft.orgData.signalIds.filter(id => id !== signalId);
    delete draft.orgData.signalNames[signalId];
    draft.orgData.activeSignalIds = draft.orgData.activeSignalIds.filter(id => id !== signalId);
    delete draft.orgData.signalTypes[signalId];

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

function updateFocusRange(draft: Project, instruction: InstructionTypes['updateFocusRange']) {
    const { focusRange } = instruction;
    const [start, end] = focusRange;
    if (start < 0 || end > draft.timelineData.numberOfFrames || start >= end) throw new Error(`Invalid focus range`);
    draft.timelineData.focusRange = focusRange;
}

function updatePlaying(draft: Project, instruction: InstructionTypes['updatePlaying']) {
    const { playing } = instruction;
    draft.timelineData.playing = playing;
}

function addCurveTemplate(draft: Project, instruction: InstructionTypes['addCurveTemplate']) {
    const { curveId, functionString } = instruction;
    if (draft.templateData[curveId]) throw new Error(`Curve template with id ${curveId} already exists`);
    draft.templateData[curveId] = functionString;
}

function deleteCurveTemplate(draft: Project, instruction: InstructionTypes['deleteCurveTemplate']) {
    const { curveId } = instruction;
    if (!draft.templateData[curveId]) throw new Error(`Curve template with id ${curveId} not found`);
    delete draft.templateData[curveId];
}

function updateCurveTemplate(draft: Project, instruction: InstructionTypes['updateCurveTemplate']) {
    const { curveId, functionString } = instruction;
    if (!draft.templateData[curveId]) throw new Error(`Curve template with id ${curveId} not found`);
    draft.templateData[curveId] = functionString;
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
    updatePins,
    updateFocusRange,
    updatePlaying,
    addCurveTemplate,
    deleteCurveTemplate,
    updateCurveTemplate,
    updatePinBezierControlPoints,
    updateSignalDefaultValue,
    updateSignalDefaultCurve
}
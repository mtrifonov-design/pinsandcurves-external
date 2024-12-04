import {  PinsAndCurvesProjectInstructionTypes, PinsAndCurvesProject, PinsAndCurvesProjectInstruction } from "./types";
import { produce } from "immer";
import * as t from './Transformers'

type Project = PinsAndCurvesProject;
type InstructionTypes = PinsAndCurvesProjectInstructionTypes;
type InstructionTypeKeys = keyof InstructionTypes;
type Instruction = PinsAndCurvesProjectInstruction;

type Transformer<K extends InstructionTypeKeys> = (
    draft: Project,
    instruction: InstructionTypes[K]
) => void;

type Transformers = {
    [K in InstructionTypeKeys]: Transformer<K>
}

const transformers : Transformers = {
    addPin : t.addPin,
    deletePin : t.deletePin,
    updatePinTime : t.updatePinTime,
    updatePinValue : t.updatePinValue,
    updatePins : t.updatePins,
    updateCurve : t.updateCurve,
    createSignal : t.createSignal,
    deleteSignal : t.deleteSignal,
    updateSignalName : t.updateSignalName,
    updateSignalRange   : t.updateSignalRange,
    updateSignalIndex : t.updateSignalIndex,
    updateSignalActiveStatus : t.updateSignalActiveStatus,
    updateFramesPerSecond : t.updateFramesPerSecond,
    updatePlayheadPosition : t.updatePlayheadPosition,
    updateNumberOfFrames : t.updateNumberOfFrames,
    updateProjectName : t.updateProjectName,
    updateFocusRange : t.updateFocusRange

  };

function PinsAndCurvesProjectTransformer<K extends InstructionTypeKeys>(
  project: Project,
  instructions: InstructionTypes[K][]
): Project {
  return produce(project, (draft) => {
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      const transformer = transformers[instruction.type] as Transformer<K>;
      transformer(draft, instruction);
    }
    // const transformer = transformers[instruction.type] as Transformer<K>;
    // transformer(draft, instruction);
  });
}


export { PinsAndCurvesProjectTransformer };
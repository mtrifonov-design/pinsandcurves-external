import type * as Project from '../ProjectDataStructure/Project'

interface PinsAndCurvesProjectInstructionTypes {
  addPin: { type: 'addPin'; signalId: string, pinId: string; pinTime: number; pinValue: number | string, functionString?: string }
  deletePin: { type: 'deletePin'; pinId: string }
  updatePinTime: { type: 'updatePinTime'; pinId: string; pinTime: number }
  updatePinValue: { type: 'updatePinValue'; pinId: string; pinValue: number | string }
  updateCurve: { type: 'updateCurve'; pinId: string; functionString: string }
  createSignal: { type: 'createSignal'; signalId: string; signalType: 'continuous' | 'discrete'; signalName: string; range?: [number, number] }
  deleteSignal: { type: 'deleteSignal'; signalId: string }
  updateSignalName: { type: 'updateSignalName'; signalId: string; signalName: string }
  updateSignalRange: { type: 'updateSignalRange'; signalId: string; range: [number, number] }
  updateSignalIndex: { type: 'updateSignalIndex'; signalId: string; index: number }
  updateSignalActiveStatus: { type: 'updateSignalActiveStatus'; signalId: string; active: boolean }
  updateFramesPerSecond: { type: 'updateFramesPerSecond'; framesPerSecond: number }
  updatePlayheadPosition: { type: 'updatePlayheadPosition'; playheadPosition: number }
  updateNumberOfFrames: { type: 'updateNumberOfFrames'; numberOfFrames: number }
  updateProjectName: { type: 'updateProjectName'; projectName: string }
}

type PinsAndCurvesProjectInstruction = PinsAndCurvesProjectInstructionTypes[keyof PinsAndCurvesProjectInstructionTypes]





type PinsAndCurvesProject = Project.PinsAndCurvesProject

export type { PinsAndCurvesProjectInstructionTypes, PinsAndCurvesProject, PinsAndCurvesProjectInstruction };


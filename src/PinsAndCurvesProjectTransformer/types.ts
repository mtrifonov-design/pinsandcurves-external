import type * as Project from '../ProjectDataStructure/Project'

interface PinsAndCurvesProjectInstructionTypes {
  addPin: { type: 'addPin'; signalId: string, pinId: string; pinTime: number; pinValue: number | string, 
    functionString?: string;
    bezierControlPoints?: [number, number, number, number] 
  }
  deletePin: { type: 'deletePin'; pinId: string }
  updatePinTime: { type: 'updatePinTime'; pinId: string; pinTime: number }
  updatePinValue: { type: 'updatePinValue'; pinId: string; pinValue: number | string }
  updatePins: { type: 'updatePins'; pins: { pinId: string; pinTime: number; pinValue: number | string, functionString?: string }[] }
  updateCurve: { type: 'updateCurve'; pinId: string; functionString: string }


  
  createSignal: { 
    type: 'createSignal'; signalId: string; signalType: 'continuous' | 'discrete'; signalName: string; 
    range?: [number, number], defaultValue: number | string, displayValues?: true,
    isStatic?: true, bezier?: true, defaultCurve?: string
  }
  deleteSignal: { type: 'deleteSignal'; signalId: string }
  // new:
  updateSignalDefaultValue: { type: 'updateSignalDefaultValue'; signalId: string; defaultValue: number | string }
  updateSignalDefaultCurve: { type: 'updateSignalDefaultCurve'; signalId: string; defaultCurve: string }
  updatePinBezierControlPoints: { type: 'updatePinBezierControlPoints'; pinId: string; bezierControlPoints: [number,number,number,number] }
  


  updateSignalName: { type: 'updateSignalName'; signalId: string; signalName: string }
  updateSignalRange: { type: 'updateSignalRange'; signalId: string; range: [number, number] }
  updateSignalIndex: { type: 'updateSignalIndex'; signalId: string; index: number }
  updateSignalActiveStatus: { type: 'updateSignalActiveStatus'; signalId: string; active: boolean }
  updateFramesPerSecond: { type: 'updateFramesPerSecond'; framesPerSecond: number }
  updatePlayheadPosition: { type: 'updatePlayheadPosition'; playheadPosition: number }
  updateNumberOfFrames: { type: 'updateNumberOfFrames'; numberOfFrames: number }
  updateProjectName: { type: 'updateProjectName'; projectName: string }
  updateFocusRange: { type: 'updateFocusRange'; focusRange: [number, number] }
  updatePlaying: { type: 'updatePlaying'; playing: boolean }


  addCurveTemplate: { type: 'addCurveTemplate'; curveId: string; functionString: string }
  deleteCurveTemplate: { type: 'deleteCurveTemplate'; curveId: string }
  updateCurveTemplate: { type: 'updateCurveTemplate'; curveId: string; functionString: string }
}

type PinsAndCurvesProjectInstruction = PinsAndCurvesProjectInstructionTypes[keyof PinsAndCurvesProjectInstructionTypes]





type PinsAndCurvesProject = Project.PinsAndCurvesProject

export type { PinsAndCurvesProjectInstructionTypes, PinsAndCurvesProject, PinsAndCurvesProjectInstruction };


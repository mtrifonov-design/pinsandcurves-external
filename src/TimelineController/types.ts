import { ProjectNode, ProjectDataStructure, PinsAndCurvesProjectTransformer, StateTimeWorm, InterpolateSignalValue } from "..";

type InterpolateSignalReturnType = InterpolateSignalValue.InterpolateSignalReturnType;

type Instruction = PinsAndCurvesProjectTransformer.PinsAndCurvesProjectInstruction;

type Project = ProjectDataStructure.PinsAndCurvesProject;

type ProjectNodeEventDispatcher = (e: ProjectNode.ProjectNodeEvent<Project, Instruction>) => void;

type PACProject = ProjectDataStructure.PinsAndCurvesProject;

type WormCommand = StateTimeWorm.WormCommand<Instruction>;


type PinUpdateQueue = ({
    pinId: string;
    pinType: 'discrete';
    pinTime?: number;
    pinValue?: string;
} |
{
    pinId: string;
    pinType: 'continuous';
    pinTime?: number;
    pinValue?: number;
    functionString?: string;
    bezierControlPoints?: [number, number, number, number];
})[]

interface ProjectTools {
    addPinContinuous: (signalId: string, pinId: string, pinTime: number, pinValue: number, functionString: string, commit?: boolean) => void;
    addPinDiscrete: (signalId: string, pinId: string, pinTime: number, pinValue: string, commit?: boolean) => void;
    deletePin: (pinId: string) => void;
    deletePins: (pinIds: string[]) => void;
    updatePins: (pinUpdateQueue: PinUpdateQueue, commit? :boolean) => void;
    updateCurve: (pinId: string, functionString: string) => void;
    updatePinBezierControlPoints: (pinId: string, bezierControlPoints: [number, number, number, number],commit?: boolean) =>  void;
    
    // createSignal: (signalId: string, signalType: 'continuous' | 'discrete', signalName: string, range?: [number, number]) => void;

    createDiscreteSignal: (signalId: string, signalName: string, defaultValue: string, isStatic?: true) => void;
    createDiscreteBeatSignal: (signalId: string, signalName: string) => void;
    createContinuousSignal: (signalId: string, signalName: string, range: [number, number], defaultValue: number, defaultCurve: string, isStatic?: true) => void;
    createContinuousBezierSignal: (signalId: string, signalName: string, range: [number, number], defaultValue: number, defaultCurve: string, isStatic?: true) => void;
    updateSignalDefaultValue: (signalId: string, defaultValue: number | string) => void;
    duplicateSignal: (signalId: string) => void;
    deleteSignal: (signalId: string) => void;
    updateSignalName: (signalId: string, signalName: string) => void;
    updateSignalRange: (signalId: string, range: [number, number]) => void;
    updateSignalIndex: (signalId: string, index: number, commit?: boolean) => void;
    updateSignalActiveStatus: (signalId: string, active: boolean) => void;
    updateFramesPerSecond: (framesPerSecond: number) => void;
    // playNextFrame: (nextFrame: number) => void;
    updatePlayheadPosition: (playheadPosition: number, commit?: boolean) => void;
    updateNumberOfFrames: (numberOfFrames: number) => void;
    updateProjectName: (projectName: string) => void;
    undo: () => void;
    redo: () => void;
    returnToLastCommit: () => void;
    pushUpdate: () => void;
    updateFocusRange: (focusRange: [number, number]) => void;
    addCurveTemplate: (curveId: string, functionString: string) => void;
    deleteCurveTemplate: (curveId: string) => void;
    updateCurveTemplate: (curveId: string, functionString: string) => void;

    startPlayback: () => void;
}

interface PACProjectController {
    getProject(): PACProject;
    subscribeToProjectUpdates(callback: Function): void;
    projectTools: ProjectTools;
    interpolateSignalValueAtTime(signalId: string, time: number): InterpolateSignalReturnType;
}

export type { PACProjectController, ProjectTools, ProjectNodeEventDispatcher, Project, Instruction, WormCommand, PinUpdateQueue  };
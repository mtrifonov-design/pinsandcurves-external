import { PinsAndCurvesProjectInstruction } from '../PinsAndCurvesProjectTransformer';
import { ContinuousSignal, ContinuousBezierSignal, DiscreteSignal, Signal } from '../ProjectDataStructure';
import { ProjectTools, WormCommand, Instruction, Project, PinUpdateQueue } from './types'

function generateId() : string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function clamp(value: number, min: number, max: number) : number {
    return Math.min(Math.max(value, min), max);
}

const commitCommand : WormCommand = {
    type: 'saveAsNamedState',
    namedState: 'commit'
}

const returnToCommitCommand : WormCommand = {
    type: 'goToNamedState',
    namedState: 'commit'
}
 
function __addPinInstruction(project: Project, signalId: string, pinId: string, pinTime: number, pinValue: number | string, functionString?: string, bezierControlPoints? : [number,number,number,number]) : Instruction {
    if (functionString && !bezierControlPoints) {
        const { numberOfFrames } = project.timelineData;
        const handle1time = -5
        const handle2time = 5
        const handle1value = 0 as number;
        const handle2value = 0 as number;
        bezierControlPoints = [handle1time, handle1value, handle2time, handle2value];
    }

    return {
        type: 'addPin',
        signalId,
        pinId,
        pinTime,
        pinValue,
        functionString,
        bezierControlPoints
    } as Instruction
}

function __deletePinCommand(getProject: () => Project, pinId: string) : WormCommand {
    const project = getProject();
    const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
    if (!signalId) throw new Error("Pin not found");
    const signalType = (project.signalData[signalId] as Signal).type;
    const bezier = signalType === 'continuous' && "bezier" in (project.signalData[signalId] as ContinuousSignal);
    const pinTime = (project.signalData[signalId] as Signal).pinTimes[pinId] as number;
    const pinValue = (project.signalData[signalId] as Signal).pinValues[pinId] as number | string;
    const functionString = signalType === 'continuous' ? (project.signalData[signalId] as ContinuousSignal).curves[pinId] : undefined;
    const bezierControlPoints = bezier ? (project.signalData[signalId] as ContinuousBezierSignal).bezierControlPoints[pinId] : undefined;
    return {
    type: 'addNextState',
    forward: [
        {
            type: 'deletePin',
            pinId
        }
    ],
    backward: [
        __addPinInstruction(project, signalId, pinId, pinTime, pinValue, functionString, bezierControlPoints)
    ]
    }
}


function constructProjectTools(pushUpdate: () => void, pushCommand: (w: () => WormCommand) => void, pushCommands: (w: () => WormCommand[]) => void, getProject: () => Project) : ProjectTools {

    function returnToCommit() {
        pushCommand(() => returnToCommitCommand)
    }

    function pushCommit() {
        pushCommand(() => commitCommand)
    }

    return {
        returnToLastCommit() : void {
            returnToCommit()
        },
        pushUpdate,
        addPinContinuous(signalId: string, pinId: string, pinTime: number, pinValue: number, functionString: string, commit?: boolean) : void {
            if (commit) returnToCommit();
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId] as ContinuousSignal;
                const pinTimes = signal.pinTimes;
                const existingPinIdIdx = signal.pinIds.findIndex(existingPinId => pinTimes[existingPinId] === pinTime);

                const forwardInstructions : Instruction[] = [];
                if (existingPinIdIdx !== -1) {
                    forwardInstructions.push({
                        type: 'deletePin',
                        pinId: signal.pinIds[existingPinIdIdx]
                    });
                }
                forwardInstructions.push(__addPinInstruction(project, signalId, pinId, pinTime, pinValue, functionString));
                const backwardInstructions : Instruction[] = [];
                backwardInstructions.push({
                    type: 'deletePin',
                    pinId  
                });
                if (existingPinIdIdx !== -1) {
                    const existingPinId = signal.pinIds[existingPinIdIdx] as string;
                    backwardInstructions.push(__addPinInstruction(project, signalId, existingPinId, signal.pinTimes[existingPinId] as number, signal.pinValues[existingPinId] as number, signal.curves[existingPinId] as string));
                }
                return {
                    type: 'addNextState',
                    forward: forwardInstructions,
                    backward: backwardInstructions
                }
            });
            if (commit) {pushCommit(),pushUpdate()}
        },
        addPinDiscrete(signalId: string, pinId: string, pinTime: number, pinValue: string, commit?: boolean) : void {
            if (commit) returnToCommit();
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId] as DiscreteSignal;
                const pinTimes = signal.pinTimes;
                const existingPinIdIdx = signal.pinIds.findIndex(existingPinId => pinTimes[existingPinId] === pinTime);
                const forwardInstructions : Instruction[] = [];
                if (existingPinIdIdx !== -1) {
                    forwardInstructions.push({
                        type: 'deletePin',
                        pinId: signal.pinIds[existingPinIdIdx]
                    });
                }
                forwardInstructions.push(__addPinInstruction(project, signalId, pinId, pinTime, pinValue));
                const backwardInstructions : Instruction[] = [];
                backwardInstructions.push({
                    type: 'deletePin',
                    pinId  
                });
                if (existingPinIdIdx !== -1) {
                    const existingPinId = signal.pinIds[existingPinIdIdx] as string;
                    backwardInstructions.push(__addPinInstruction(project, signalId, existingPinId, signal.pinTimes[existingPinId] as number, signal.pinValues[existingPinId] as string));
                }
                return {
                    type: 'addNextState',
                    forward: forwardInstructions,
                    backward: backwardInstructions
                }
            });
            if (commit) {pushCommit(),pushUpdate()}
        },
        deletePin(pinId: string) : void {
            returnToCommit()
            pushCommand(() => {
                return __deletePinCommand(getProject, pinId)
            })
            pushCommit()
            pushUpdate()
        },
        deletePins(pinIds: string[]) : void {
            returnToCommit()
            pinIds.forEach(pinId => {
                pushCommand(() => {
                    return __deletePinCommand(getProject, pinId)
                })
            });
            pushCommit()
            pushUpdate()
        },
        
        updatePins(pinUpdateQueue: PinUpdateQueue, commit?: boolean) : void {
            if (commit) returnToCommit();
            const project = getProject();
            const forwardUpdates : Instruction = {
                type: 'updatePins',
                pins: []
            };
            const backwardUpdates : Instruction = {
                type: 'updatePins',
                pins: []
            }
            pinUpdateQueue.forEach(pinUpdate => {
                const pinId = pinUpdate.pinId;
                const signalId = project.orgData.signalIdByPinId[pinId];
                let proposedPinTime = pinUpdate.pinTime;
                let proposedPinValue = pinUpdate.pinValue;
                let proposedFunctionString = pinUpdate.pinType === 'continuous' ? pinUpdate.functionString : undefined;
                const existingPinTime = (project.signalData[signalId] as Signal).pinTimes[pinId] as number; 
                const existingPinValue = (project.signalData[signalId] as Signal).pinValues[pinId] as number | string;
                const existingFunctionString = pinUpdate.pinType === "continuous" ? (project.signalData[signalId] as ContinuousSignal).curves[pinId] as string | undefined : undefined;
                const forwardUpdate = {
                    pinId,
                    pinTime: proposedPinTime ?? existingPinTime,
                    pinValue: proposedPinValue ?? existingPinValue,
                    functionString: proposedFunctionString ?? existingFunctionString,
                }
                const backwardUpdate = {
                    pinId,
                    pinTime: existingPinTime,
                    pinValue: existingPinValue,
                    functionString: existingFunctionString
                }
                forwardUpdates.pins.push(forwardUpdate);
                backwardUpdates.pins.push(backwardUpdate);
            });
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [forwardUpdates],
                backward: [backwardUpdates]
            }})
            if (commit) {pushCommit()}
            pushUpdate()
        },
        updateCurve(pinId: string, functionString: string) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
                if (!signalId) throw new Error("Pin not found");
                const signalType = (project.signalData[signalId] as Signal).type;
                if (signalType === 'discrete') throw new Error("Cannot update curve of discrete signal");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateCurve',
                        pinId,
                        functionString
                    }
                ],
                backward: [
                    {
                        type: 'updateCurve',
                        pinId,
                        functionString: (project.signalData[signalId] as ContinuousSignal).curves[pinId] as string
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        updatePinBezierControlPoints(pinId: string, bezierControlPoints: [number, number, number, number],commit?:boolean) : void {
            if (commit) returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
                if (!signalId) throw new Error("Pin not found");
                const signalType = (project.signalData[signalId] as Signal).type;
                if (signalType === 'discrete') throw new Error("Cannot update bezier control points of discrete signal");
                if (!("bezier" in (project.signalData[signalId] as ContinuousSignal))) throw new Error("Signal is not a bezier signal")
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updatePinBezierControlPoints',
                        pinId,
                        bezierControlPoints
                    }
                ],
                backward: [
                    {
                        type: 'updatePinBezierControlPoints',
                        pinId,
                        bezierControlPoints: (project.signalData[signalId] as ContinuousBezierSignal).bezierControlPoints[pinId] as [number, number, number, number]
                    }
                ]
            }})
            if (commit) {pushCommit()}
            pushUpdate()
        },


        // createSignal(signalId: string, signalType: 'continuous' | 'discrete', signalName: string, range?: [number, number]) : void {
        //     returnToCommit()
        //     pushCommand(() => {
        //         return {
        //         type: 'addNextState',
        //         forward: [
        //             {
        //                 type: 'createSignal',
        //                 signalId,
        //                 signalType,
        //                 signalName,
        //                 range
        //             }
        //         ],
        //         backward: [
        //             {
        //                 type: 'deleteSignal',
        //                 signalId
        //             }
        //         ]
        //     }})
        //     pushCommit()
        //     pushUpdate()
        // },

        createDiscreteSignal(signalId: string, signalName: string, defaultValue: string, isStatic?: true) : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType: 'discrete',
                        signalName,
                        defaultValue,
                        isStatic,
                        displayValues: true
                    }
                ],
                backward: [
                    {
                        type: 'deleteSignal',
                        signalId
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        createDiscreteBeatSignal(signalId: string, signalName: string) : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType: 'discrete',
                        signalName,
                        defaultValue : 'beat',
                    }
                ],
                backward: [
                    {
                        type: 'deleteSignal',
                        signalId
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        createContinuousSignal(signalId: string, signalName: string, range: [number, number], defaultValue: number, defaultCurve: string, isStatic?: true) : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType: 'continuous',
                        signalName,
                        range,
                        defaultValue,
                        defaultCurve,
                        isStatic
                    }
                ],
                backward: [
                    {
                        type: 'deleteSignal',
                        signalId
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        createContinuousBezierSignal(signalId: string, signalName: string, range: [number, number], defaultValue: number, defaultCurve: string, isStatic?: true) : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType: 'continuous',
                        signalName,
                        range,
                        defaultValue,
                        defaultCurve,
                        isStatic,
                        bezier: true
                    }
                ],
                backward: [
                    {
                        type: 'deleteSignal',
                        signalId
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },


        duplicateSignal(signalId: string) : void {
            returnToCommit()
            const newSignalId = generateId();
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                const signalName = project.orgData.signalNames[signalId];
                const signalDefaultValue = signal.defaultValue;
                const signalDefaultCurve = signal.type === 'continuous' ? (signal as ContinuousSignal).defaultCurve : undefined;
                const isStatic = signal.isStatic;
                const bezier = signal.type === 'continuous' && "bezier" in (signal as ContinuousSignal);
                const displayValues = signal.type === 'discrete' ? (signal as DiscreteSignal).displayValues : undefined;

                const newSignalName = signalName + '_copy';
                const range = signal.type === 'continuous' ? (signal as ContinuousSignal).range : undefined;
                return {
                    type: 'addNextState',
                    forward: [
                        {
                            type: 'createSignal',
                            signalId: newSignalId,
                            signalType: signal.type,
                            signalName: newSignalName,
                            range,
                            defaultValue: signalDefaultValue,
                            defaultCurve: signalDefaultCurve,
                            isStatic,
                            bezier: bezier ? true : undefined,
                            displayValues: displayValues ? true : undefined
                        }
                    ],
                    backward: [
                        {
                            type: 'deleteSignal',
                            signalId: newSignalId
                        }
                    ]
                }
            });
            pushCommand(() => {
                const project = getProject();
                const pinIds = (project.signalData[signalId] as Signal).pinIds;
                const signalType = (project.signalData[signalId] as Signal).type;
                const newPins = pinIds.map(pinId => {
                    const pinTime = (project.signalData[signalId] as Signal).pinTimes[pinId] as number;
                    const pinValue = (project.signalData[signalId] as Signal).pinValues[pinId] as number | string;
                    let functionString;
                    if (signalType === 'continuous') {
                        functionString = (project.signalData[signalId] as ContinuousSignal).curves[pinId];
                    }
                    return {
                        pinTime,
                        pinValue,
                        functionString,
                        pinId: generateId(),
                    }
                });
                const createPinsInstructions = newPins.map(newPin => {
                    return __addPinInstruction(project, newSignalId, newPin.pinId, newPin.pinTime, newPin.pinValue, newPin.functionString);
                });
                const deletePinsInstructions : {type:"deletePin", pinId: string}[] = newPins.map(newPin => {
                    return {
                        type: 'deletePin',
                        pinId: newPin.pinId
                    }
                })
                return {
                    type: 'addNextState',
                    forward: createPinsInstructions,
                    backward: deletePinsInstructions
                }
            });  
            pushCommit()
            pushUpdate()
        },
        deleteSignal(signalId: string) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'deleteSignal',
                        signalId
                    }
                ],
                backward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType: signal.type,
                        signalName: project.orgData.signalNames[signalId],
                        range: signal.type === 'continuous' ? (signal as ContinuousSignal).range : undefined,
                        defaultValue: signal.defaultValue,
                        defaultCurve: signal.type === 'continuous' ? (signal as ContinuousSignal).defaultCurve : undefined,
                        isStatic: signal.isStatic,
                        bezier: signal.type === 'continuous' && "bezier" in (signal as ContinuousSignal) ? true : undefined,
                        bezierControlPoints: signal.type === 'continuous' && "bezier" in (signal as ContinuousSignal) ? (signal as ContinuousBezierSignal).bezierControlPoints : undefined,
                        displayValues: signal.type === 'discrete' ? (signal as DiscreteSignal).displayValues : undefined
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        updateSignalDefaultValue(signalId: string, defaultValue: number | string) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateSignalDefaultValue',
                        signalId,
                        defaultValue
                    }
                ],
                backward: [
                    {
                        type: 'updateSignalDefaultValue',
                        signalId,
                        defaultValue: signal.defaultValue
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },

        updateSignalName(signalId: string, signalName: string) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateSignalName',
                        signalId,
                        signalName
                    }
                ],
                backward: [
                    {
                        type: 'updateSignalName',
                        signalId,
                        signalName: project.orgData.signalNames[signalId]
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updateSignalRange(signalId: string, range: [number, number]) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                if (signal.type === 'discrete') throw new Error("Cannot update range of discrete signal");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateSignalRange',
                        signalId,
                        range
                    }
                ],
                backward: [
                    {
                        type: 'updateSignalRange',
                        signalId,
                        range: (signal as ContinuousSignal).range
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updateSignalIndex(signalId: string, index: number, commit?: boolean) : void {
            if (commit) returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateSignalIndex',
                        signalId,
                        index
                    }
                ],
                backward: [
                    {
                        type: 'updateSignalIndex',
                        signalId,
                        index: project.orgData.activeSignalIds.indexOf(signalId)
                    }
                ]
            }})
            if (commit) {pushCommit()}
            pushUpdate()
        },
        updateSignalActiveStatus(signalId: string, active: boolean) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId];
                if (!signal) throw new Error("Signal not found");
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateSignalActiveStatus',
                        signalId,
                        active
                    }
                ],
                backward: [
                    {
                        type: 'updateSignalActiveStatus',
                        signalId,
                        active: project.orgData.activeSignalIds.includes(signalId)
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updateFramesPerSecond(framesPerSecond: number) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateFramesPerSecond',
                        framesPerSecond
                    }
                ],
                backward: [
                    {
                        type: 'updateFramesPerSecond',
                        framesPerSecond: project.timelineData.framesPerSecond
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updatePlayheadPosition(playheadPosition: number, commit?: boolean) : void {
            if (commit) returnToCommit()
            pushCommand(() => {
                const project = getProject();
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updatePlayheadPosition',
                        playheadPosition
                    }
                ],
                backward: [
                    {
                        type: 'updatePlayheadPosition',
                        playheadPosition: project.timelineData.playheadPosition
                    }
                ]
            }})
            if (commit) {pushCommit()}
            pushUpdate()
        },
        playNextFrame(nextFrame : number) : void {
            const project = getProject();
            const playheadPosition = project.timelineData.playheadPosition;
            const [start,stop] = project.timelineData.focusRange;
            const duration = stop - start;
            const newPlayheadPosition = ((playheadPosition + 1)-start)%duration + start;
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updatePlaying',
                        playing: true
                    },
                    {
                        type: 'updatePlayheadPosition',
                        playheadPosition: nextFrame
                    }
                ],
                backward: [
                    {
                        type: 'updatePlayheadPosition',
                        playheadPosition
                    },
                    {
                        type: 'updatePlaying',
                        playing: false
                    },
                ]
            }})
            pushUpdate()
        },
        updateFocusRange(range: [number, number]) : void {
            const [start, end] = range;
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateFocusRange',
                        focusRange: [start,end]
                    }
                ],
                backward: [
                    {
                        type: 'updateFocusRange',
                        focusRange: project.timelineData.focusRange
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updateNumberOfFrames(numberOfFrames: number) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateNumberOfFrames',
                        numberOfFrames
                    }
                ],
                backward: [
                    {
                        type: 'updateNumberOfFrames',
                        numberOfFrames: project.timelineData.numberOfFrames
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        updateProjectName(projectName: string) : void {
            returnToCommit()
            pushCommand(() => {
                const project = getProject();
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'updateProjectName',
                        projectName
                    }
                ],
                backward: [
                    {
                        type: 'updateProjectName',
                        projectName: project.metaData.name
                    }
                ]
            }})
            pushCommit()
            pushUpdate()
        },
        undo() : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'previous'
            }})
            pushCommit()
            pushUpdate()
        },
        redo() : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'next'
            }})
            pushCommit()
            pushUpdate()
        },
        addCurveTemplate(curveId: string, functionString: string) : void {
            pushCommand(() => {
                return {
                type: 'appendToCurrentState',
                forward: [
                    {
                        type: 'addCurveTemplate',
                        curveId,
                        functionString
                    }
                ],
                backward: [
                    {
                        type: 'deleteCurveTemplate',
                        curveId
                    }
                ]
            }})
            pushUpdate()
        },
        deleteCurveTemplate(curveId: string) : void {
            pushCommand(() => {
                return {
                type: 'appendToCurrentState',
                forward: [
                    {
                        type: 'deleteCurveTemplate',
                        curveId
                    }
                ],
                backward: [
                    {
                        type: 'addCurveTemplate',
                        curveId,
                        functionString: (getProject().templateData[curveId] as string)
                    }
                ]
                
            }})
            pushUpdate()
        },
        updateCurveTemplate(curveId: string, functionString: string) : void {
            pushCommand(() => {
                return {
                type: 'appendToCurrentState',
                forward: [
                    {
                        type: 'updateCurveTemplate',
                        curveId,
                        functionString
                    }
                ],
                backward: [
                    {
                        type: 'updateCurveTemplate',
                        curveId,
                        functionString: (getProject().templateData[curveId] as string)
                    }
                ]
            }})
            pushUpdate()
        }

    }
}

export default constructProjectTools;
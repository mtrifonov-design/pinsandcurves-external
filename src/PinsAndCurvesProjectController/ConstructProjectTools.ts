import { PinsAndCurvesProjectInstruction } from '../PinsAndCurvesProjectTransformer';
import { ContinuousSignal, DiscreteSignal, Signal } from '../ProjectDataStructure';
import { ProjectTools, WormCommand, Instruction, Project, PinUpdateQueue } from './types'

// interface ProjectTools {
//     addPin: (signalId: string, pinId: string, pinTime: number, pinValue: number | string, commit?: boolean) => void;
//     deletePin: (pinId: string) => void;
//     updatePinTime: (pinId: string, pinTime: number, commit?: boolean) => void;
//     updatePinValue: (pinId: string, pinValue: number | string, commit?: boolean) => void;
//     updateCurve: (pinId: string, functionString: string) => void;
//     createSignal: (signalId: string, signalType: 'continuous' | 'discrete', signalName: string, range?: [number, number]) => void;
//     deleteSignal: (signalId: string) => void;
//     updateSignalName: (signalId: string, signalName: string) => void;
//     updateSignalRange: (signalId: string, range: [number, number]) => void;
//     updateSignalIndex: (signalId: string, index: number, commit?: boolean) => void;
//     updateSignalActiveStatus: (signalId: string, active: boolean) => void;
//     updateFramesPerSecond: (framesPerSecond: number) => void;
//     updatePlayheadPosition: (playheadPosition: number, commit?: boolean) => void;
//     updateNumberOfFrames: (numberOfFrames: number) => void;
//     updateProjectName: (projectName: string) => void;
//     undo: () => void;
//     redo: () => void;
// }

function generateId() : string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


const commitCommand : WormCommand = {
    type: 'saveAsNamedState',
    namedState: 'commit'
}

const returnToCommitCommand : WormCommand = {
    type: 'goToNamedState',
    namedState: 'commit'
}

function __addPinInstruction(signalId: string, pinId: string, pinTime: number, pinValue: number | string, functionString?: string) : Instruction {
    return {
        type: 'addPin',
        signalId,
        pinId,
        pinTime,
        pinValue,
        functionString
    }
}

function __addPinContinuousCommand(signalId: string, pinId: string, pinTime: number, pinValue: number, functionString: string) : WormCommand {
    return {
        type: 'addNextState',
        forward: [
            __addPinInstruction(signalId, pinId, pinTime, pinValue, functionString)
        ],
        backward: [
            {
                type: 'deletePin',
                pinId
            }
        ]
    }
}

function __addPinDiscreteCommand(signalId: string, pinId: string, pinTime: number, pinValue: string) : WormCommand {
    return {
        type: 'addNextState',
        forward: [
            __addPinInstruction(signalId, pinId, pinTime, pinValue)
        ],
        backward: [
            {
                type: 'deletePin',
                pinId
            }
        ]
    }
}

function __deletePinCommand(getProject: () => Project, pinId: string) : WormCommand {
    const project = getProject();
    const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
    if (!signalId) throw new Error("Pin not found");
    const signalType = (project.signalData[signalId] as Signal).type;
    const pinTime = (project.signalData[signalId] as Signal).pinTimes[pinId] as number;
    const pinValue = (project.signalData[signalId] as Signal).pinValues[pinId] as number | string;
    const functionString = signalType === 'continuous' ? (project.signalData[signalId] as ContinuousSignal).curves[pinId] : undefined;
    return {
    type: 'addNextState',
    forward: [
        {
            type: 'deletePin',
            pinId
        }
    ],
    backward: [
        __addPinInstruction(signalId, pinId, pinTime, pinValue, functionString)
    ]
    }
}

function __idleCommand() : WormCommand {
    return {
        type: 'addNextState',
        forward: [
        ],
        backward: [
        ]
        }
}


function constructProjectTools(pushUpdate: () => void, pushCommand: (w: () => WormCommand) => void, getProject: () => Project) : ProjectTools {

    function returnToCommit() {
        pushCommand(() => returnToCommitCommand)
    }

    function pushCommit() {
        pushCommand(() => commitCommand)
    }

    return {
        returnToLastCommit() : void {
            returnToCommit()
            // pushUpdate()
        },
        pushUpdate,
        addPinContinuous(signalId: string, pinId: string, pinTime: number, pinValue: number, functionString: string, commit?: boolean) : void {
            if (commit) returnToCommit();
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId] as ContinuousSignal;
                const pinTimes = signal.pinTimes;
                const existingPinIdIdx = signal.pinIds.findIndex(existingPinId => pinTimes[existingPinId] === pinTime);
                if (existingPinIdIdx !== -1) {
                    return __deletePinCommand(getProject, signal.pinIds[existingPinIdIdx]);
                }
                return __idleCommand()
            });
            pushCommand(() => {
                return __addPinContinuousCommand(signalId, pinId, pinTime, pinValue, functionString)
            })
            if (commit) {pushCommit(),pushUpdate()}
        },
        addPinDiscrete(signalId: string, pinId: string, pinTime: number, pinValue: string, commit?: boolean) : void {
            if (commit) returnToCommit()
            pushCommand(() => {
                const project = getProject();
                const signal = project.signalData[signalId] as ContinuousSignal;
                const pinTimes = signal.pinTimes;
                const existingPinIdIdx = signal.pinIds.findIndex(existingPinId => pinTimes[existingPinId] === pinTime);
                if (existingPinIdIdx !== -1) {
                    return __deletePinCommand(getProject, signal.pinIds[existingPinIdIdx]);
                }
                return __idleCommand()
            });
            pushCommand(() => {
                return __addPinDiscreteCommand(signalId, pinId, pinTime, pinValue)
            })
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
        // updatePins(pinUpdateQueue: PinUpdateQueue, commit?: boolean) : void {
        //     if (commit) returnToCommit()
        //     pinUpdateQueue.forEach(pinUpdate => {
        //         if (pinUpdate.pinType ==='continuous') {
        //             const {pinId, pinTime, pinValue, functionString} = pinUpdate;
        //             pushCommand(() => {
        //                 const project = getProject();
        //                 const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
        //                 if (!signalId) throw new Error("Pin not found");
        //                 const signalType = (project.signalData[signalId] as Signal).type;
        //                 if (signalType === 'discrete') throw new Error("Cannot update continuous pin of discrete signal");
        //                 const pinTimes = (project.signalData[signalId] as Signal).pinTimes;
        //                 const pinValues = (project.signalData[signalId] as Signal).pinValues;
        //                 const curves = (project.signalData[signalId] as ContinuousSignal).curves;
        //                 const newPinValue = pinValue ?? pinValues[pinId] as number;
        //                 const newPinTime = pinTime ?? pinTimes[pinId] as number;
        //                 const newFunctionString = functionString ?? curves[pinId] as string;
        //                 return {
        //                 type: 'addNextState',
        //                 forward: [
        //                     {
        //                         type: 'updatePinValue',
        //                         pinId,
        //                         pinValue: newPinValue
        //                     },
        //                     {
        //                         type: 'updatePinTime',
        //                         pinId,
        //                         pinTime: newPinTime
        //                     },
        //                     {
        //                         type: 'updateCurve',
        //                         pinId,
        //                         functionString: newFunctionString
        //                     }
        //                 ],
        //                 backward: [
        //                     {
        //                         type: 'updatePinValue',
        //                         pinId,
        //                         pinValue: pinValues[pinId] as number
        //                     },
        //                     {
        //                         type: 'updatePinTime',
        //                         pinId,
        //                         pinTime: pinTimes[pinId] as number
        //                     },
        //                     {
        //                         type: 'updateCurve',
        //                         pinId,
        //                         functionString: curves[pinId] as string
        //                     }
        //                 ]
        //             }})
        //         }
        //         if (pinUpdate.pinType === 'discrete') {
        //             const {pinId, pinTime, pinValue} = pinUpdate;
        //             pushCommand(() => {
        //                 const project = getProject();
        //                 const signalId = Object.keys(project.signalData).find(signalId => project.signalData[signalId]?.pinIds.includes(pinId));
        //                 if (!signalId) throw new Error("Pin not found");
        //                 const signalType = (project.signalData[signalId] as Signal).type;
        //                 if (signalType === 'continuous') throw new Error("Cannot update discrete pin of continuous signal");
        //                 const pinTimes = (project.signalData[signalId] as Signal).pinTimes;
        //                 const pinValues = (project.signalData[signalId] as Signal).pinValues;
        //                 const newPinValue = pinValue ?? pinValues[pinId] as string;
        //                 const newPinTime = pinTime ?? pinTimes[pinId] as number;
        //                 return {
        //                 type: 'addNextState',
        //                 forward: [
        //                     {
        //                         type: 'updatePinValue',
        //                         pinId,
        //                         pinValue: newPinValue
        //                     },
        //                     {
        //                         type: 'updatePinTime',
        //                         pinId,
        //                         pinTime: newPinTime
        //                     }
        //                 ],
        //                 backward: [
        //                     {
        //                         type: 'updatePinValue',
        //                         pinId,
        //                         pinValue: pinValues[pinId] as string
        //                     },
        //                     {
        //                         type: 'updatePinTime',
        //                         pinId,
        //                         pinTime: pinTimes[pinId] as number
        //                     }
        //                 ]
        //             }})
        //         }
        //     });
        //     if (commit) {pushCommit()}
        //     pushUpdate()
        // },
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
        createSignal(signalId: string, signalType: 'continuous' | 'discrete', signalName: string, range?: [number, number]) : void {
            returnToCommit()
            pushCommand(() => {
                return {
                type: 'addNextState',
                forward: [
                    {
                        type: 'createSignal',
                        signalId,
                        signalType,
                        signalName,
                        range
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
                            range
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
                    return __addPinInstruction(newSignalId, newPin.pinId, newPin.pinTime, newPin.pinValue, newPin.functionString);
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
                        range: signal.type === 'continuous' ? (signal as ContinuousSignal).range : undefined
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
        }

    }
}

export default constructProjectTools;
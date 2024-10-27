interface Instruction {
    type: string;
    payload: any;
}

interface EdgeInstructions {
    backward: Instruction[],
    forward: Instruction[],
}


interface StateTimeWorm {
    maxSize: number;
    cursors: {
        [cursorId : string] : string,
    },
    states: string[];
    instructions: {
        [instructionPairId: string] : EdgeInstructions,
    }
}

type CommandType = "getInstructions" 
| "replaceStates"
| "updateCursor"
| "getCursor"
| "addState"
| "trimWorm"
| "moveCursorToTargetCursor"

interface WormCommand {
    commandType: CommandType,
    payload: any[],
}


export type {Instruction, EdgeInstructions, StateTimeWorm, WormCommand, CommandType}



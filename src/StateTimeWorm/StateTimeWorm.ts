import { Instruction, StateTimeWorm, EdgeInstructions, WormCommand, CommandType } from './types';
import { produce } from 'immer';

// All operations described here should be immutable

const generateId = () : string => {
    let id = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < 10; i++) {
        id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return id;
}

const getInstructions = (worm: StateTimeWorm, startState: string, endState: string) : Instruction[] => {
    const startIndex = worm.states.indexOf(startState);
    const endIndex = worm.states.indexOf(endState);
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Invalid startState or endState');
    }

    let instructions: Instruction[] = [];

    if (startIndex < endIndex) {
        for (let i = startIndex; i < endIndex; i++) {
            instructions = instructions.concat(worm.instructions[`${worm.states[i]}-${worm.states[i+1]}`]?.forward || []);
        }
    } else if (startIndex > endIndex) {
        for (let i = startIndex; i > endIndex; i--) {
            instructions = instructions.concat(worm.instructions[`${worm.states[i-1]}-${worm.states[i]}`]?.backward || []);
        }
    } else {
        return [];
    }

    return instructions;
};

const replaceStates = (worm: StateTimeWorm, startState: string, endState: string, edge: EdgeInstructions | undefined) : StateTimeWorm => {
    const startIndex = worm.states.indexOf(startState);
    const endIndex = worm.states.indexOf(endState);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Invalid startState or endState');
    }

    return produce(worm, draft => {
        // Remove edges between the states being cut out
        if (startIndex < endIndex) {
            for (let i = startIndex + 1; i < endIndex; i++) {
                delete draft.instructions[`${worm.states[i-1]}-${worm.states[i]}`];
                delete draft.instructions[`${worm.states[i]}-${worm.states[i+1]}`];
            }
            draft.states.splice(startIndex + 1, endIndex - startIndex - 1);
        } else {
            for (let i = endIndex + 1; i < startIndex; i++) {
                delete draft.instructions[`${worm.states[i-1]}-${worm.states[i]}`];
                delete draft.instructions[`${worm.states[i]}-${worm.states[i+1]}`];
            }
            draft.states.splice(endIndex + 1, startIndex - endIndex - 1);
        }

        if (edge) {
            draft.instructions[`${startState}-${endState}`] = edge;
        }
    });
};


const addState = (worm: StateTimeWorm, cursorId: string, edge: EdgeInstructions) : StateTimeWorm => {
    const currentState = worm.cursors[cursorId];
    //console.log(currentState)
    const currentStateIndex = worm.states.indexOf(currentState);

    if (currentStateIndex === -1) {
        throw new Error('Invalid cursor state');
    }

    return produce(worm, draft => {
        // Remove edges of states being cut out
        if (currentStateIndex < draft.states.length - 1) {
            for (let i = currentStateIndex; i < draft.states.length - 1; i++) {
                delete draft.instructions[`${worm.states[i]}-${worm.states[i+1]}`];
            }
            draft.states.splice(currentStateIndex + 1);
        }

        const newState = `state${generateId()}`;
        draft.states.push(newState);
        draft.instructions[`${currentState}-${newState}`] = edge;
        draft.cursors[cursorId] = newState;
    });
};


const trimWorm = (worm: StateTimeWorm) : StateTimeWorm => {
    return produce(worm, draft => {
        if (draft.states.length > draft.maxSize) {
            const excess = draft.states.length - draft.maxSize;
            draft.states.splice(0, excess);
        }
    });
};

const updateCursor = (worm: StateTimeWorm, cursorId: string, stateId: string | null) : StateTimeWorm => {
    return produce(worm, draft => {
        if (stateId === null) {
            delete draft.cursors[cursorId];
        } else {
            draft.cursors[cursorId] = stateId;
        }
    });
};

const getCursor = (worm: StateTimeWorm, cursorId: string) : string => {
    const stateId = worm.cursors[cursorId];
    return worm.states.includes(stateId) ? stateId : '';
};

const moveCursorToTargetCursor = (worm: StateTimeWorm, cursorId: string, targetCursorId: string) : StateTimeWorm => {
    const targetState = worm.cursors[targetCursorId];
    return updateCursor(worm, cursorId, targetState);
}



const StateTimeWormManager: Record<CommandType, (...args: any[]) => any> = {
    getInstructions,
    replaceStates,
    updateCursor,
    getCursor,
    moveCursorToTargetCursor,
    addState,
    trimWorm,
};

const executeCommand = (worm: StateTimeWorm, command: WormCommand) : StateTimeWorm | undefined => {
    return StateTimeWormManager[command.commandType](worm,...command.payload)
}

export {executeCommand}

export default StateTimeWormManager;

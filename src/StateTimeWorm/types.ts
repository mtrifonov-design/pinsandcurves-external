interface Result {
    success: boolean;
    message: string;
}

interface InternalWorm<Object,Instruction> {
    namedStates: {
        [namedState : string]: string | undefined,
    };
    states: {
        [stateId: string] : {
            forward: Instruction[],
            backward: Instruction[],
            nextState: string | undefined,
            previousState: string | undefined,
        },
    };
    cursor: string;
    maxSize: number;
}

type Transformer<Object,Instruction> = (object: Object, instructions: Instruction[]) => Object;

interface StateTimeWorm<Object,Instruction> {
    content: Object;
    next(): Result;
    previous(): Result;
    goToNamedState(namedState : string): Result;
    saveAsNamedState(namedState : string): void;
    addNextState(forward: Instruction[], backward: Instruction[]): void;
    serialize(): string;
}

// Define a separate interface for static methods
interface StateTimeWormConstructor<Object, Instruction> {
    new (content: Object,
        transformer: Transformer<Object,Instruction>,
        existingOrMaxSize?: number | InternalWorm<Object, Instruction>
        ): StateTimeWorm<Object, Instruction>;
    deserialize(serialized: string, transformer: Transformer<Object,Instruction>): StateTimeWorm<Object, Instruction>;
}

type WormCommand<Instruction> = 
| { type: "next" }
| { type: "previous" }
| { type: "goToNamedState", namedState: string }
| { type: "saveAsNamedState", namedState: string }
| { type: "addNextState", forward: Instruction[], backward: Instruction[] }
| { type: "appendToCurrentState", forward: Instruction[], backward: Instruction[] }

export type {StateTimeWorm, Result, Transformer, InternalWorm, StateTimeWormConstructor, WormCommand}



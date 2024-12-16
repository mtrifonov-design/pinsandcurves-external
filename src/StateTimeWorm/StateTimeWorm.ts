import { StateTimeWorm, StateTimeWormConstructor, Result, Transformer, InternalWorm, WormCommand } from './types';

const generateId = () : string => {
    let id = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < 10; i++) {
        id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return id;
}

class StateTimeWormClass<Object,Instruction> implements StateTimeWorm<Object,Instruction> {

    private __internal: InternalWorm<Object,Instruction>;
    private __MAX_ITERATIONS : number;

    constructor(
        public content: Object, 
        private __transformer: Transformer<Object,Instruction>, 
        existingOrMaxSize: InternalWorm<Object,Instruction> | number = 10000) {
            if (typeof existingOrMaxSize === 'number') {
                if (existingOrMaxSize < 1) throw new Error('Max size must be greater than 0');
                this.__internal = {
                    namedStates: {},
                    states: {
                        'initial': {
                            forward: [],
                            backward: [],
                            nextState: undefined,
                            previousState: undefined,
                        },
                    },
                    cursor: 'initial',
                    maxSize: existingOrMaxSize,
                };
            } else {
                this.__internal = existingOrMaxSize;
            }

        this.__MAX_ITERATIONS = this.__internal.maxSize +1;
    }

    static deserialize<Object,Instruction>(serialized: string, transformer: Transformer<Object,Instruction>) 
    : StateTimeWormClass<Object,Instruction> {
        const {content, __internal} = JSON.parse(serialized);
        return new StateTimeWormClass(content, transformer, __internal);
    }

    serialize(): string {
        return JSON.stringify({content: this.content, __internal: this.__internal});
    }

    next(): Result {
        const nextState = this.__internal.states[this.__internal.cursor].nextState;
        if (!nextState) return {success: false, message: 'No next state'};
        const currentState = this.__internal.cursor;
        const instructions = this.__internal.states[currentState].forward;
        this.__internal.cursor = nextState;
        // for (let i = 0; i < instructions.length; i++) {
        //     this.content = this.__transformer(this.content, instructions[i]);
        // }
        this.content = this.__transformer(this.content, instructions)
        return {success: true, message: 'Next state reached'};
    }

    previous(): Result {
        const previousState = this.__internal.states[this.__internal.cursor].previousState;
        if (!previousState) return {success: false, message: 'No previous state'};
        const currentState = this.__internal.cursor;
        const instructions = this.__internal.states[currentState].backward;
        this.__internal.cursor = previousState;
        // for (let i = 0; i < instructions.length; i++) {
        //     this.content = this.__transformer(this.content, instructions[i]);
        // }
        this.content = this.__transformer(this.content, instructions)
        return {success: true, message: 'Previous state reached'};
    }

    goToNamedState(namedState: string): Result {
        // find the named state
        // if it doesnt exist, return notification
        // if it exists, move the cursor to that state

        // Find Named State, handle case if not found
        const targetState = this.__internal.namedStates[namedState];
        if (!targetState) return {success: false, message: 'Named state not found'};
        if (!this.__internal.states[targetState]) throw new Error('Named state has no corresponding state');

        // Move Cursor to Named State
        const startState = this.__internal.cursor;
        if (targetState === startState) return {success: true, message: 'Already at named state'};
        let direction = 'forward';
        let state : string | undefined = startState;
        let iterations = 0;
        while (state && iterations < this.__MAX_ITERATIONS) {
            iterations++;
            if (state === targetState) {
                direction = 'backward';
            };
            state = this.__internal.states[state].previousState;
        }
        
        if (direction === 'forward') {
            iterations = 0;
            while (this.__internal.cursor !== targetState && iterations < this.__MAX_ITERATIONS) {
                iterations++;
                const result = this.next();
                if (!result.success) throw new Error(result.message);
            }
        } else {
            iterations = 0;
            while (this.__internal.cursor !== targetState && iterations < this.__MAX_ITERATIONS) {
                iterations++;
                const result = this.previous();
                if (!result.success) throw new Error(result.message);
            }
        }
        return {success: true, message: 'Moved to named state'};
    }

    saveAsNamedState(namedState: string): void {
        this.__internal.namedStates[namedState] = this.__internal.cursor;
    }

    appendToCurrentState(forward: Instruction[],backward: Instruction[]): void {
        this.content = this.__transformer(this.content, forward);
        const currentState = this.__internal.cursor;
        const existingForward = this.__internal.states[currentState].forward;
        const existingBackward = this.__internal.states[currentState].backward;
        this.__internal.states[currentState].forward = existingForward.concat(forward);
        this.__internal.states[currentState].backward = backward.concat(existingBackward);
    }

    addNextState(forward: Instruction[], backward: Instruction[]): void {
        // 1. delete all states after the current state
        // 2. add a new state after the current state and move cursor
        // 3. and make sure to trim the worm to the maxSize from the start
        // 4. delete all named states that are no longer reachable
        {
            // Delete Future States
            const currentState = this.__internal.cursor;
            let futureStates = [];
            let state : string | undefined = currentState;
            let iterations = 0;
            while (state && iterations < this.__MAX_ITERATIONS) {
                iterations++;
                state = this.__internal.states[state].nextState;
                if (state) futureStates.push(state);
            }
            futureStates.forEach(state => {
                delete this.__internal.states[state];
            });
        }
        {
            // Add New State and Move Cursor
            const currentState = this.__internal.cursor;
            const newState = `state${generateId()}`;
            this.__internal.states[newState] = {
                forward,
                backward,
                nextState: undefined,
                previousState: currentState,
            };
            this.__internal.states[currentState].nextState = newState;
            this.__internal.cursor = newState;
            this.content = this.__transformer(this.content,forward)
            // this.content = forward.reduce(this.__transformer, this.content);
        }
        {
            // Trim Worm
            const currentState = this.__internal.cursor;
            let count = 1;
            let state : string | undefined = currentState;
            let statesToKeep = [currentState];
            let iterations = 0;
            while (state && count < this.__internal.maxSize && iterations < this.__MAX_ITERATIONS) {
                iterations++;
                state = this.__internal.states[state].previousState;
                if (state) statesToKeep.push(state);
                count++;
            }
            const stateToDelete = Object.keys(this.__internal.states).filter(state => !statesToKeep.includes(state));
            stateToDelete.forEach(state => {
                delete this.__internal.states[state];
            });
            statesToKeep.forEach((state, index) => {
                const previousState = this.__internal.states[state].previousState;
                const nextState = this.__internal.states[state].nextState;
                if (previousState && !this.__internal.states[previousState]) {
                    this.__internal.states[state].previousState = undefined;
                }
                if (nextState && !this.__internal.states[nextState]) {
                    this.__internal.states[state].nextState = undefined;
                }
            });

        }
        {
            // Delete Unreachable Named States
            const namedStates = Object.keys(this.__internal.namedStates);
            namedStates.forEach(namedState => {
                const state = this.__internal.namedStates[namedState];
                if (!state) throw new Error('Named state has no corresponding state');
                if (!this.__internal.states[state]) {
                    delete this.__internal.namedStates[namedState];
                }
            });
        }
    }

    executeCommand(command: WormCommand<Instruction>) : void {
        switch (command.type) {
            case 'next':
                this.next();
                break;
            case 'previous':
                this.previous();
                break;
            case 'goToNamedState':
                this.goToNamedState(command.namedState);
                break;
            case 'saveAsNamedState':
                this.saveAsNamedState(command.namedState);
                break;
            case 'addNextState':
                this.addNextState(command.forward, command.backward);
                break;
            case 'appendToCurrentState':
                this.appendToCurrentState(command.forward, command.backward);
                break;
            default:
                throw new Error('Invalid command');
        }
    }

    executeCommands(commands: WormCommand<Instruction>[]) : void {
        // find consecutive 
        commands.forEach(command => this.executeCommand(command));
    }

}

export default StateTimeWormClass;

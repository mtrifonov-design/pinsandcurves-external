// The purpose of this mini library is to present a universal abstraction for
// receiving minimal instructions on how to update the project state
// and translating those into callback functions that can produce a next state based on a previous state

import orgOperations from './orgOperations.ts';
        
import pinAndCurveOperations from './pinAndCurveOperations';
import configOperations from './configOperations';


const INSTRUCTIONS = {
    ...orgOperations,
    ...pinAndCurveOperations,
    ...configOperations,
}

const produceNextProjectDataState = (previousState,instruction) => {
    return INSTRUCTIONS[instruction.type](instruction.payload)(previousState);
}

export default produceNextProjectDataState;
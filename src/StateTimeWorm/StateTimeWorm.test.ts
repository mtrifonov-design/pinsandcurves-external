// // Test suite for StateTimeWormClass
// import StateTimeWormConstructor from './StateTimeWorm';
// import { Result, Transformer, StateTimeWorm } from './types';

// type Instruction = { type: 'increment' | 'decrement', value: number };
// type Counter = { count: number };


// describe('StateTimeWormClass', () => {
//     let initialContent: { count: number };
//     let transformer: Transformer<Counter, Instruction>;
//     let stateTimeWorm: StateTimeWorm<Counter, Instruction>;

//     beforeEach(() => {
//         initialContent = { count: 0 };
//         transformer = (content, instruction) => {
//             switch (instruction.type) {
//                 case 'increment':
//                     return { ...content, count: content.count + instruction.value };
//                 case 'decrement':
//                     return { ...content, count: content.count - instruction.value };
//                 default:
//                     return content;
//             }
//         };
//         stateTimeWorm = new StateTimeWormConstructor(initialContent, transformer);
//     });

//     test('should initialize with the given content', () => {
//         expect(stateTimeWorm.content).toEqual(initialContent);
//     });

//     test('should serialize and deserialize correctly', () => {
//         const serialized = stateTimeWorm.serialize();
//         const deserializedWorm = StateTimeWormConstructor.deserialize(serialized, transformer);
//         expect(deserializedWorm.content).toEqual(initialContent);
//         expect(deserializedWorm.serialize()).toEqual(serialized);
//     });

//     test('should navigate forward correctly', () => {
//         stateTimeWorm.addNextState([{ type: 'increment', value: 5 }], [{ type: 'decrement', value: 5 }]);
//         expect(stateTimeWorm.content.count).toBe(5);
//     });

//     test('should navigate backward correctly', () => {
//         stateTimeWorm.addNextState([{ type: 'increment', value: 5 }], [{ type: 'decrement', value: 5 }]);
//         const result = stateTimeWorm.previous();
//         expect(result.success).toBe(true);
//         expect(stateTimeWorm.content.count).toBe(0);
//     });

//     test('should return correct message if no next state is available', () => {
//         const result = stateTimeWorm.next();
//         expect(result.success).toBe(false);
//         expect(result.message).toBe('No next state');
//     });

//     test('should return correct message if no previous state is available', () => {
//         const result = stateTimeWorm.previous();
//         expect(result.success).toBe(false);
//         expect(result.message).toBe('No previous state');
//     });

//     test('should save and go to named state correctly', () => {
//         stateTimeWorm.addNextState([{ type: 'increment', value: 5 }], [{ type: 'decrement', value: 5 }]);
//         stateTimeWorm.saveAsNamedState('stateA');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 10 }], [{ type: 'decrement', value: 10 }]);
//         const result = stateTimeWorm.goToNamedState('stateA');
//         expect(result.success).toBe(true);
//         expect(stateTimeWorm.content.count).toBe(5);
//     });

//     test('should return correct message if named state is not found', () => {
//         const result = stateTimeWorm.goToNamedState('nonExistentState');
//         expect(result.success).toBe(false);
//         expect(result.message).toBe('Named state not found');
//     });

//     test('should trim states correctly when adding new states beyond max size', () => {
//         stateTimeWorm = new StateTimeWormConstructor(initialContent, transformer, 2);
//         stateTimeWorm.addNextState([{ type: 'increment', value: 1 }], [{ type: 'decrement', value: 1 }]);
//         stateTimeWorm.saveAsNamedState('state1');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 2 }], [{ type: 'decrement', value: 2 }]);
//         stateTimeWorm.saveAsNamedState('state2');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 3 }], [{ type: 'decrement', value: 3 }]);
//         stateTimeWorm.saveAsNamedState('state3');

//         // After trimming, state1 should no longer exist
//         const result = stateTimeWorm.goToNamedState('state1');
//         expect(result.success).toBe(false);
//         expect(result.message).toBe('Named state not found');
//     });

//     test('specific bug', () => {
//         stateTimeWorm = new StateTimeWormConstructor(initialContent, transformer, 100);
//         stateTimeWorm.saveAsNamedState('commit');

//         stateTimeWorm.goToNamedState('commit');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 1 }], [{ type: 'decrement', value: 1 }]);

//         stateTimeWorm.goToNamedState('commit');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 1 }], [{ type: 'decrement', value: 1 }]);

//         expect(stateTimeWorm.content.count).toBe(1);

//     });

//     test('should delete future states when adding new states', () => {
//         stateTimeWorm = new StateTimeWormConstructor(initialContent, transformer, 10);
//         stateTimeWorm.addNextState([{ type: 'increment', value: 1 }], [{ type: 'decrement', value: 1 }]);
//         stateTimeWorm.saveAsNamedState('state1');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 2 }], [{ type: 'decrement', value: 2 }]);
//         stateTimeWorm.saveAsNamedState('state2');
//         stateTimeWorm.addNextState([{ type: 'increment', value: 3 }], [{ type: 'decrement', value: 3 }]);
//         stateTimeWorm.saveAsNamedState('state3');

//         stateTimeWorm.previous();
//         stateTimeWorm.addNextState([{ type: 'increment', value: 4 }], [{ type: 'decrement', value: 4 }]);
//         stateTimeWorm.saveAsNamedState('state4');

//         // After trimming, state1 should no longer exist, but state2, state3, and state4 should
//         let result = stateTimeWorm.goToNamedState('state1');
//         expect(result.success).toBe(true);

//         result = stateTimeWorm.goToNamedState('state2');
//         expect(result.success).toBe(true);

//         result = stateTimeWorm.goToNamedState('state3');
//         expect(result.success).toBe(false);
//         expect(result.message).toBe('Named state not found');

//         result = stateTimeWorm.goToNamedState('state4');
//         expect(result.success).toBe(true);
//     });
// });

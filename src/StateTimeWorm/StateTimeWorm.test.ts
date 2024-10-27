import StateTimeWormManager from './StateTimeWorm';
import { StateTimeWorm, EdgeInstructions } from './types';

describe('StateTimeWormManager', () => {
    let worm: StateTimeWorm;

    beforeEach(() => {
        worm = {
            maxSize: 5,
            cursors: { 'cursor1': 'state1', "cursor2": "state2" },
            states: ['state0', 'state1', 'state2'],
            instructions: {
                'state0-state1': { forward: [{ type: 'fwd0-1', payload: 'test' }], backward: [{ type: 'bwd0-1', payload: 'test' }] },
                'state1-state2': { forward: [{ type: 'fwd1-2', payload: 'test' }], backward: [{ type: 'bwd1-2', payload: 'test' }] },
            }
        };
    });

    it('getInstructions should return forward instructions', () => {
        const instructions = StateTimeWormManager.getInstructions(worm, 'state0', 'state2');
        expect(instructions).toEqual([{ type: 'fwd0-1', payload: 'test' }, { type: 'fwd1-2', payload: 'test' }]);
    });

    it('getInstructions should return backward instructions', () => {
        const instructions = StateTimeWormManager.getInstructions(worm, 'state2', 'state0');
        expect(instructions).toEqual([{ type: 'bwd1-2', payload: 'test' }, { type: 'bwd0-1', payload: 'test' }]);
    });

    it('replaceStates should replace states between startState and endState', () => {
        const edge: EdgeInstructions = { forward: [{ type: 'newFwd', payload: 'test' }], backward: [{ type: 'newBwd', payload: 'test' }] };
        const newWorm = StateTimeWormManager.replaceStates(worm, 'state0', 'state2', edge);
        expect(newWorm.states).toEqual(['state0', 'state2']);
        expect(newWorm.instructions['state0-state2']).toEqual(edge);
    });

    it('addState should add a new state and update the cursor', () => {
        const edge: EdgeInstructions = { forward: [{ type: 'newFwd', payload: 'test' }], backward: [{ type: 'newBwd', payload: 'test' }] };
        const oldCursorValue = worm.cursors["cursor2"]
        const newWorm = StateTimeWormManager.addState(worm, 'cursor2', edge);
        expect(newWorm.states.length).toEqual(4);
        expect(newWorm.cursors['cursor2'] !== oldCursorValue).toBe(true);
    });

    it('trimWorm should trim states to stay within maxSize', () => {
        worm.states = ['state0', 'state1', 'state2', 'state3', 'state4', 'state5'];
        const newWorm = StateTimeWormManager.trimWorm(worm);
        expect(newWorm.states).toEqual(['state1', 'state2', 'state3', 'state4', 'state5']);
    });

    it('updateCursor should update an existing cursor', () => {
        const newWorm = StateTimeWormManager.updateCursor(worm, 'cursor1', 'state2');
        expect(newWorm.cursors['cursor1']).toBe('state2');
    });

    it('updateCursor should delete an existing cursor', () => {
        const newWorm = StateTimeWormManager.updateCursor(worm, 'cursor1', null);
        expect(newWorm.cursors['cursor1']).toBeUndefined();
    });

    it('updateCursor should create a new cursor', () => {
        const newWorm = StateTimeWormManager.updateCursor(worm, 'cursor2', 'state0');
        expect(newWorm.cursors['cursor2']).toBe('state0');
    });

    it('getCursor should return the associated state id', () => {
        const stateId = StateTimeWormManager.getCursor(worm, 'cursor1');
        expect(stateId).toBe('state1');
    });

    it('getCursor should return an empty string for invalid cursor', () => {
        const stateId = StateTimeWormManager.getCursor(worm, 'invalidCursor');
        expect(stateId).toBe('');
    });

    it('replaceStates should clean up obsolete edges', () => {
        worm.states.push('state3');
        worm.instructions['state2-state3'] = { forward: [{ type: 'fwd2-3', payload: 'test' }], backward: [{ type: 'bwd2-3', payload: 'test' }] };
    
        const edge: EdgeInstructions = { forward: [{ type: 'newFwd', payload: 'test' }], backward: [{ type: 'newBwd', payload: 'test' }] };
        const newWorm = StateTimeWormManager.replaceStates(worm, 'state0', 'state3', edge);
    
        expect(newWorm.states).toEqual(['state0', 'state3']);
        expect(newWorm.instructions['state0-state3']).toEqual(edge);
        expect(newWorm.instructions['state1-state2']).toBeUndefined();
        expect(newWorm.instructions['state2-state3']).toBeUndefined();
    });
    
    it('addState should clean up obsolete edges', () => {
        worm.states.push('state3');
        worm.instructions['state2-state3'] = { forward: [{ type: 'fwd2-3', payload: 'test' }], backward: [{ type: 'bwd2-3', payload: 'test' }] };
    
        const edge: EdgeInstructions = { forward: [{ type: 'newFwd', payload: 'test' }], backward: [{ type: 'newBwd', payload: 'test' }] };
        const newWorm = StateTimeWormManager.addState(worm, 'cursor1', edge);

        expect(newWorm.states.length).toEqual(3);
        expect(Object.keys(newWorm.instructions).length).toEqual(2);
        expect(newWorm.instructions['state1-state2']).toBeUndefined();
        expect(newWorm.instructions['state2-state3']).toBeUndefined();
    });
    
});

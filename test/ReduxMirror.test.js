import chai from 'chai';
import ReduxMirror from '../src/ReduxMirror';
import {
  createReflection,
  clearReflection,
  updateMirror,
} from '../src/actions';

const expect = chai.expect;

describe('ReduxMirror class', () => {
  context('when constructed with a key value store of reducers', () => {
    const reducerA = state => state;
    const reducerB = state => state;
    let reduxMirror;

    beforeEach(() => {
      reduxMirror = new ReduxMirror({
        a: reducerA,
        b: reducerB,
      });
    });

    describe('ReduxMirror#reducers', () => {
      it('returns an object with all reducers and the reflections reducer', () => {
        const reducers = reduxMirror.reducers();
        expect(reducers).to.have.property('a');
        expect(reducers).to.have.property('b');
        expect(reducers).to.have.property('reflections');
      });
    });
    describe('ReduxMirror#combinedReducers', () => {
      it('returns an reducer function with all reducers and the reflections reducer', () => {
        const reducers = reduxMirror.combinedReducers();
        expect(reducers).to.be.a('function');
        expect(reducers({}, {})).to.deep.equal({
          a: {},
          b: {},
          reflections: {
            a: {},
            b: {},
          },
        });
      });
    });
  });
});

describe('reducers returned by ReduxMirror', () => {
  const simpleReducer = (state = { counter: 0, other: 0 }, action) => {
    let v;
    switch (action.type) {
    case 'ADD':
      v = action.payload || 1;
      return { ...state, counter: state.counter + v };
    case 'SUBTRACT':
      v = action.payload || 1;
      return { ...state, counter: state.counter - v };
    case 'SET_OTHER':
      v = action.payload || 0;
      return { ...state, other: v };
    default:
      return state;
    }
  };
  let reducer;

  beforeEach(() => {
    const reduxMirror = new ReduxMirror({
      simple: simpleReducer,
    });
    reducer = reduxMirror.combinedReducers();
  });

  describe('the mirrored reducers actions', () => {
    context('when it recieves the updateMirror action', () => {
      it('merges whatever state is passed as the action.payload', () => {
        const state = {
          simple: { counter: 1, other: 2 },
        };
        const newState = reducer(state, updateMirror({ counter: 3 }));
        expect(newState.simple).to.deep.equal({ counter: 3, other: 2 });
      });
    });
    context('when it recieves actions that include a reflection id', () => {
      it('ignores the action', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              new: { counter: 1, other: 2 },
            },
          },
        };
        const action = { type: 'ADD', reflection: 'new', payload: 2 };
        const newState = reducer(state, action);
        expect(newState.simple).to.deep.equal({ counter: 1, other: 2 });
      });
    });
    context('when it recieves any other actions', () => {
      it('acts normaly and modifies the state as if it was not mirrored', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              new: { counter: 1, other: 2 },
            },
          },
        };
        const action = { type: 'ADD', payload: 2 };
        const newState = reducer(state, action);
        expect(newState.simple).to.deep.equal({ counter: 3, other: 2 });
      });
    });
  });

  describe('the reflection reducer actions', () => {
    context('when it recieves the createReflection action', () => {
      it('creates a new property with the id specified by the payload.id and sets its state as payload.state', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {},
          },
        };
        const action = createReflection({ id: 'whatever', state: state.simple });
        const newState = reducer(state, action);
        expect(newState.reflections.simple.whatever).to.deep.equal(state.simple);
      });
    });
    context('when it recieves the clearReflection action', () => {
      it('removes the targeted reflection from the reflections state', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              'some-id': { counter: 1, other: 2 },
            },
          },
        };
        const action = clearReflection('some-id');
        const newState = reducer(state, action);
        expect(newState.reflections.simple['some-id']).to.deep.equal(undefined);
      });
    });
    context('when it recieves actions that include a reflection id', () => {
      it('modifies the reflection state as if it was the original reducer', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              new: { counter: 1, other: 2 },
            },
          },
        };
        const action = { type: 'SUBTRACT', reflection: 'new', payload: 5 };
        const newState = reducer(state, action);
        expect(newState.reflections.simple.new).to.deep.equal({ counter: -4, other: 2 });
      });

      it('does not modify the original reducers', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              new: { counter: 1, other: 2 },
            },
          },
        };
        const action = { type: 'SUBTRACT', reflection: 'new', payload: 5 };
        const newState = reducer(state, action);
        expect(newState.simple).to.deep.equal({ counter: 1, other: 2 });
      });
    });
    context('when it recieves any other actions', () => {
      it('ignores the action', () => {
        const state = {
          simple: { counter: 1, other: 2 },
          reflections: {
            simple: {
              new: { counter: 1, other: 2 },
            },
          },
        };
        const action = { type: 'SUBTRACT', payload: 5 };
        const newState = reducer(state, action);
        expect(newState.reflections.simple.new).to.deep.equal({ counter: 1, other: 2 });
      });
    });
  });
});

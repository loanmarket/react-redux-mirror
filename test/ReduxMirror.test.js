import 'babel-polyfill';
import chai from 'chai';
import ReduxMirror from '../src/ReduxMirror';

const expect = chai.expect;

describe('ReduxMirror class', () => {
  context('when constructed with a key value store of reducers', () => {
    const reducerA = (state, action) => state;
    const reducerB = (state, action) => state;
    let reduxMirror;
    beforeEach(() => {
      reduxMirror = new ReduxMirror({
        a: reducerA,
        b: reducerB,
      });
    })

    it('mirrors all reducers passed to constructor', () => {
      const reducers = reduxMirror.reducers();
      expect(reducers).to.have.property('a');
      expect(reducers).to.have.property('b');
      expect(reducers).to.have.property('reflections');
      console.log(reducers.reflections);
    })

    describe("ReduxMirror#mirrorReducer", () => {
      it('adds a new reducer to ReduxMirror', () => {
        const newReducer = (state, action) => state
        reduxMirror.mirrorReducer(newReducer, 'c');
        // expect()
      })
    });
  });
});

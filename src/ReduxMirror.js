import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import update from 'immutability-helper';
import mapValues from 'lodash.mapvalues';
import { mirrorReducer, reflectionReducer } from './reducers';

export default class ReduxMirror {
  constructor(reducersToMirror) {
    this.originalReducers = {};
    const mirror = (reducer, name) => {
      this.originalReducers[name] = reducer;
      const reducerWithMirrorActions = reduceReducers(reducer, mirrorReducer);
      return (state, action) => {
        if (state === undefined) return reducerWithMirrorActions(state, action);
        if (action && action.reflection) {
          return state;
        }
        return reducerWithMirrorActions(state, action);
      };
    };
    this.mirrored = mapValues(reducersToMirror, mirror);
  }

  reducers() {
    return {
      ...this.mirrored,
      reflections: this.reflectionsReducer(),
    };
  }

  combinedReducers() {
    return combineReducers(this.reducers());
  }

  reflectionsReducer() {
    return combineReducers(mapValues(this.originalReducers, (reducer) => {
      return (state, action) => {
        if (!action || !action.reflection) return reflectionReducer(state, action);
        return update(state, { [action.reflection]: { $set: reducer(state[action.reflection], action) } });
      };
    }));
  }
}

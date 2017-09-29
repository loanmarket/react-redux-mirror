import { handleActions } from 'redux-actions';
import update from 'immutability-helper';

import {
  UPDATE_MIRROR,
  CREATE_REFLECTION,
  CLEAR_REFLECTION,
} from './actionTypes';

const INITIAL_STATE = {};

export const mirrorReducer = handleActions(
  {
    [UPDATE_MIRROR](state, { payload }) {
      return update(state, { $merge: payload });
    },
  },
  INITIAL_STATE,
);

export const reflectionReducer = handleActions(
  {
    [CREATE_REFLECTION](state, { payload }) {
      return update(state, { [payload.id]: { $set: payload.state } });
    },
    [CLEAR_REFLECTION](state, { payload }) {
      return update(state, { $unset: [payload] });
    },
  },
  INITIAL_STATE,
);

import { createAction } from 'redux-actions';
import { CREATE_REFLECTION, CLEAR_REFLECTION, UPDATE_MIRROR } from './actionTypes';

export const createReflection = createAction(CREATE_REFLECTION);
export const clearReflection = createAction(CLEAR_REFLECTION);
export const updateMirror = createAction(UPDATE_MIRROR);

import Mirror from './ReduxMirror';
import connect, { reduxMirrorPropTypes as propTypes } from './connectToMirror';

export const reduxMirrorPropTypes = propTypes;
export const connectToMirror = connect;
export const ReduxMirror = Mirror;

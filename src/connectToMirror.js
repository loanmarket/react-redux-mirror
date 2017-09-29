import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import pick from 'lodash.pick';

import { createReflection, clearReflection, updateMirror } from './actions';

export const reduxMirrorPropTypes = {
  sync: PropTypes.func.isRequired,
};

export default (options, mapStateToProps, mapDispatchToProps, mergeProps) => (WrappedComponent) => {
  invariant(options && options.mirror, 'connectToMirror require options.mirror to be set to valid reducer name');
  invariant(options && (options.subset === undefined || (Array.isArray(options.subset) && options.subset.every(_.isString))),
    'connectToMirror expects subset to be undefined or an array of strings');
  // Could do addition check here to ensure that mirror is actually mirrored in ReduxMirror
  // It would require this to be generated by the ReduxMirror class or have access to the instance

  const targetMirror = options.mirror;
  const reflectionId = options.id || 'new';

  const filterReflectedState = (state) => {
    const content = state[targetMirror];
    return options.subset ? pick(content, options.subset) : content;
  };

  const mapReflectedState = (state, ownProps) => {
    const mapped = mapStateToProps({
      [targetMirror]: state.reflections[targetMirror][reflectionId],
    }, ownProps);
    return mapped;
  };

  const dispatchToReflection = dispatch => (action) => {
    action.reflection = reflectionId;
    dispatch(action);
  };

  const mappedDispatch = dispatch => mapDispatchToProps(dispatchToReflection(dispatch));
  const ConnectedComponent = connect(mapReflectedState, mappedDispatch, mergeProps)(WrappedComponent);

  class Mirror extends Component {

    static contextTypes = {
      store: PropTypes.object.isRequired,
    };

    sync = () => {
      const { store: { getState, dispatch } } = this.context;
      dispatch(updateMirror(getState().reflections[targetMirror][reflectionId]));
    };

    componentWillMount() {
      const { store: { getState, dispatch } } = this.context;
      dispatch(createReflection({
        id: reflectionId,
        state: filterReflectedState(getState()),
      }));
    }

    componentWillUnmount() {
      const { store: { dispatch } } = this.context;
      dispatch(clearReflection(reflectionId));
    }

    render() {
      return <ConnectedComponent {...this.props} sync={this.sync} />;
    }
  }

  return Mirror;
};



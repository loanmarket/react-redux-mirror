import 'babel-polyfill';
import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import Enzyme, { mount } from 'enzyme';
import * as reactRedux from 'react-redux';
import configureStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import _ from 'lodash';

import connectToMirror from '../src/connectToMirror';
import { CREATE_REFLECTION, CLEAR_REFLECTION, UPDATE_MIRROR } from '../src/actionTypes';

Enzyme.configure({ adapter: new Adapter() });

describe('connectToMirror(options)', () => {
  context('with malformed options', () => {
    it('throws an error if options is undefined', () => {
      expect(() => connectToMirror()).to.throw(/requires options\.mirror/);
    });
    it('throws an error if options.mirror is undefined', () => {
      expect(() => connectToMirror({ id: 111 })).to.throw(/requires options\.mirror/);
    });
    it('throws an error if options.subset is not undefined or an array of strings', () => {
      const invalidSubsetOptions = [{}, 'eh', NaN, 111, [1, 'woo'], []];
      invalidSubsetOptions.forEach(
        subset => expect(
          () => connectToMirror({ mirror: 'test', subset }),
        ).to.throw(/expects subset to be undefined or an array of strings/),
      );
    });
  });

  const randomId = Math.floor(Math.random() * 1000);
  const subsetId = Math.floor(Math.random() * 1000);
  const contexts = [{
    description: 'with only options.mirror set',
    options: { mirror: 'someName' },
    expectedId: 'new',
  },
  {
    description: 'with options.mirror and id specified',
    options: { mirror: 'another', id: randomId },
    expectedId: randomId,
  },
  {
    description: 'with subset option',
    options: { mirror: 'withSubset', id: subsetId, subset: ['a'] },
    expectedId: subsetId,
  }];

  contexts.forEach((ctx) => {
    context(ctx.description, () => {
      const { options, expectedId } = ctx;
      describe('the returned connect-like function', () => {
        let stub;
        let connectLike;

        beforeEach(() => {
          stub = sinon.stub(reactRedux, 'connect');
          connectLike = connectToMirror(options);
        });

        afterEach(() => {
          stub.restore();
        });

        it('calls react-redux connect() once', () => {
          connectLike();
          expect(reactRedux.connect.calledOnce).to.equal(true);
        });

        it('makes mapStateToProps to refer to new reflection of mirror', () => {
          const mockedState = {
            [options.mirror]: {
              a: 'A',
              b: 'B',
            },
            reflections: {
              [options.mirror]: {
                [expectedId]: 'mirrored',
              },
            },
          };
          const mapStateToProps = state => ({
            data: state[options.mirror],
          });
          stub.callsFake((transformedMapStateToProps) => {
            expect(transformedMapStateToProps).to.be.a('function');
            expect(transformedMapStateToProps(mockedState)).to.deep.equal({
              data: mockedState.reflections[options.mirror][expectedId],
            });
          });
          connectLike(mapStateToProps);
          expect(reactRedux.connect.calledOnce).to.equal(true);
        });

        it('adds default reflection id to each action passed to mapDispatchToProps', () => {
          const mapDispatchToProps = dispatch => ({
            test: payload => dispatch({ type: 'TEST_ACTION', payload }),
            another: payload => dispatch({ type: 'ANOTHER_ACTION', payload }),
          });
          const fakeDispatch = sinon.stub();
          fakeDispatch.callsFake((action) => {
            expect(action.payload).to.be.a('string');
            expect(action.reflection).to.equal(expectedId);
          });
          stub.callsFake((transformedMapStateToProps, transformedMapDispatchToProps) => {
            const actions = transformedMapDispatchToProps(fakeDispatch);
            actions.test('woo');
            actions.another('ok');
          });
          connectLike(null, mapDispatchToProps);

          expect(reactRedux.connect.calledOnce).to.equal(true);
          expect(fakeDispatch.calledTwice).to.equal(true);
        });

        it('directly passes mergeProps to connect without any modification', () => {
          const passedInMergeProps = () => 'fake';
          stub.callsFake((transformedMapStateToProps, transformedMapDispatchToProps, mergeProps) => {
            expect(mergeProps).to.equal(passedInMergeProps);
          });
          connectLike(null, null, passedInMergeProps);
          expect(reactRedux.connect.calledOnce).to.equal(true);
        });
      });

      describe('HOC returned after connect', () => {
        const mockStore = configureStore([]);
        const mockedState = {
          [options.mirror]: {
            a: 'A',
            b: 'B',
          },
          reflections: {
            [options.mirror]: {
              [expectedId]: 'mirrored',
              'some-other-id': 'not effected',
            },
          },
        };
        const mapStateToProps = state => ({
          data: state[options.mirror],
        });
        const mapDispatchToProps = dispatch => ({
          anAction: payload => dispatch({ type: 'AN_ACTION', payload }),
        });
        const WrappedComponent = () => <div id="wrapper"></div>;
        let Mirror;

        beforeEach(() => {
          Mirror = connectToMirror(options)(mapStateToProps, mapDispatchToProps)(WrappedComponent);
        });

        it('passes sync method to child sync which dispatches updateMirror action with current state of reflection', () => {
          const store = mockStore(mockedState);
          const wrapper = mount(<Mirror />, { context: { store } });
          const childProps = wrapper.children().props();
          expect(childProps).to.have.property('sync');
          expect(childProps.sync).to.be.a('function');
          childProps.sync();
          const actions = store.getActions();
          expect(actions).have.length(2);
          expect(actions[1]).to.deep.equal({
            type: UPDATE_MIRROR,
            payload: mockedState.reflections[options.mirror][expectedId],
          });
        });

        it('dispatches createReflection on componentWillMount that mirrors subset or whole state', () => {
          const store = mockStore(mockedState);
          const wrapper = mount(<Mirror />, { context: { store } });
          const actions = store.getActions();
          expect(actions).have.length(1);
          var expectedState = options.subset ?  _.pick(mockedState[options.mirror], options.subset) : mockedState[options.mirror];
          expect(actions[0]).to.deep.equal({
            type: CREATE_REFLECTION,
            payload: { id: expectedId, state: expectedState },
          });
          wrapper.unmount();
        });

        it('dispatches clearReflection on componentWillUnmount', () => {
          const store = mockStore(mockedState);
          const wrapper = mount(<Mirror />, { context: { store } });
          wrapper.unmount();
          const actions = store.getActions();
          expect(actions).have.length(2);
          expect(actions[1]).to.deep.equal({
            type: CLEAR_REFLECTION,
            payload: expectedId,
          });
        });
      });
    });
  });
});

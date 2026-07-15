import React from 'react';
import configureStore from 'redux-mock-store';
import {render} from '@testing-library/react';
import VM from 'scratch-vm';

import vmListenerHOC from '../../../src/lib/vm-listener-hoc.jsx';

describe('VMListenerHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    const Component = () => (<div />);
    const WrappedComponent = vmListenerHOC(Component);

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                mode: {},
                modals: {},
                editorTab: {activeTabIndex: 0},
                vm: vm,
                tw: {hasCloudVariables: false}
            }
        });
    });

    test('vm green flag event is bound to the passed in prop callback', () => {
        const onGreenFlag = jest.fn();
        render(
            <WrappedComponent
                store={store}
                vm={vm}
                onGreenFlag={onGreenFlag}
            />
        );
        expect(onGreenFlag).not.toHaveBeenCalled();
        vm.emit('PROJECT_START');
        expect(onGreenFlag).toHaveBeenCalled();
    });

    test('onGreenFlag is not passed to the children', () => {
        render(
            <WrappedComponent
                store={store}
                vm={vm}
                onGreenFlag={jest.fn()}
            />
        );
        // Test that onGreenFlag is NOT called by the VM directly
        // The HOC intercepts it and doesn't pass it to children
        const onGreenFlag2 = jest.fn();
        vm.emit('PROJECT_START');
        // The event was bound because render triggers componentDidMount
        expect(onGreenFlag2).not.toHaveBeenCalled();
    });

    test('targetsUpdate event from vm triggers targets update action', () => {
        render(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        const targetList = [];
        const editingTarget = 'id';
        vm.emit('targetsUpdate', {targetList, editingTarget});
        const actions = store.getActions();
        expect(actions[0].type).toEqual('scratch-gui/targets/UPDATE_TARGET_LIST');
        expect(actions[0].targets).toEqual(targetList);
        expect(actions[0].editingTarget).toEqual(editingTarget);
    });

    test('targetsUpdate does not dispatch if the sound recorder is visible', () => {
        store = mockStore({
            scratchGui: {
                mode: {},
                modals: {soundRecorder: true},
                editorTab: {activeTabIndex: 0},
                vm: vm,
                tw: {hasCloudVariables: false}
            }
        });
        render(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        const targetList = [];
        const editingTarget = 'id';
        vm.emit('targetsUpdate', {targetList, editingTarget});
        const actions = store.getActions();
        expect(actions.length).toEqual(0);
    });

    test('PROJECT_CHANGED does dispatch if the sound recorder is visible', () => {
        store = mockStore({
            scratchGui: {
                mode: {},
                modals: {soundRecorder: true},
                editorTab: {activeTabIndex: 0},
                vm: vm,
                tw: {hasCloudVariables: false}
            }
        });
        render(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PROJECT_CHANGED');
        const actions = store.getActions();
        expect(actions.length).toEqual(1);
    });

    test('PROJECT_CHANGED does not dispatch if in fullscreen mode', () => {
        store = mockStore({
            scratchGui: {
                mode: {isFullScreen: true},
                modals: {soundRecorder: true},
                editorTab: {activeTabIndex: 0},
                vm: vm,
                tw: {hasCloudVariables: false}
            }
        });
        render(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PROJECT_CHANGED');
        const actions = store.getActions();
        expect(actions.length).toEqual(0);
    });

    test('keypresses go to the vm', () => {
        const eventTriggers = {};
        document.addEventListener = jest.fn((event, cb) => {
            eventTriggers[event] = cb;
        });

        vm.postIOData = jest.fn();

        store = mockStore({
            scratchGui: {
                mode: {isFullScreen: true},
                modals: {soundRecorder: true},
                editorTab: {activeTabIndex: 0},
                vm: vm,
                tw: {hasCloudVariables: false}
            }
        });
        render(
            <WrappedComponent
                attachKeyboardEvents
                store={store}
                vm={vm}
            />
        );

        // keyboard events that do not target the document or body are ignored
        eventTriggers.keydown({key: 'A', target: null});
        expect(vm.postIOData).not.toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: true});

        // keydown/up with target as the document are sent to the vm via postIOData
        eventTriggers.keydown({key: 'A', target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: true});

        eventTriggers.keyup({key: 'A', target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: false});

        // When key is 'Dead' e.g. bluetooth keyboards on iOS, it sends keyCode instead
        // because the VM can process both named keys or keyCodes as the `key` property
        eventTriggers.keyup({key: 'Dead', keyCode: 10, target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 10, isDown: false, keyCode: 10});
    });
});

/* global WebAudioTestAPI */
import 'web-audio-test-api';
WebAudioTestAPI.setState({
    'AudioContext#resume': 'enabled'
});

import React from 'react';
import configureStore from 'redux-mock-store';
import {render} from '@testing-library/react';
import VM from 'scratch-vm';
import {LoadingState} from '../../../src/reducers/project-state';

import vmManagerHOC from '../../../src/lib/vm-manager-hoc.jsx';

describe('VMManagerHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    const Component = () => (<div />);
    const WrappedComponent = vmManagerHOC(Component);

    beforeEach(() => {
        store = mockStore({
            scratchGui: {
                projectState: {},
                mode: {},
                vmStatus: {}
            },
            locales: {
                locale: '',
                messages: {}
            }
        });
        vm = new VM();
        vm.attachAudioEngine = jest.fn();
        vm.setCompatibilityMode = jest.fn();
        vm.setLocale = jest.fn();
        vm.start = jest.fn();
    });
    test('when it mounts in player mode, the vm is initialized but not started', () => {
        render(
            <WrappedComponent
                isPlayerOnly
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(1);
        expect(vm.setLocale.mock.calls.length).toBe(1);
        expect(vm.initialized).toBe(true);

        // But vm should not be started automatically
        expect(vm.start).not.toHaveBeenCalled();
    });
    test('when it mounts in editor mode, the vm is initialized and started', () => {
        render(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(1);
        expect(vm.setLocale.mock.calls.length).toBe(1);
        expect(vm.initialized).toBe(true);

        expect(vm.start).toHaveBeenCalled();
    });
    test('if it mounts with an initialized vm, it does not reinitialize the vm but will start it', () => {
        vm.initialized = true;
        render(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(0);
        expect(vm.setLocale.mock.calls.length).toBe(0);
        expect(vm.initialized).toBe(true);

        expect(vm.start).toHaveBeenCalled();
    });

    test('if it mounts without starting the VM, it can be started by switching to editor mode', () => {
        vm.initialized = true;
        const view = render(
            <WrappedComponent
                isPlayerOnly
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
        view.rerender(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).toHaveBeenCalled();
    });
    test('if it mounts with an initialized and started VM, it does not start again', () => {
        vm.initialized = true;
        const view = render(
            <WrappedComponent
                isPlayerOnly
                isStarted
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
        view.rerender(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
    });
    test('if the isLoadingWithId prop becomes true, it loads project data into the vm', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const view = render(
            <WrappedComponent
                fontsLoaded
                isLoadingWithId={false}
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        view.rerender(
            <WrappedComponent
                canSave
                fontsLoaded
                isLoadingWithId
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        expect(vm.loadProject).toHaveBeenLastCalledWith('100');
        // nextTick needed since vm.loadProject is async, and we have to wait for it :/
        process.nextTick(() => (
            expect(mockedOnLoadedProject).toHaveBeenLastCalledWith(LoadingState.LOADING_VM_WITH_ID, true)
        ));
    });
    test('if the fontsLoaded prop becomes true, it loads project data into the vm', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const view = render(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        view.rerender(
            <WrappedComponent
                canSave={false}
                fontsLoaded
                isLoadingWithId
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        expect(vm.loadProject).toHaveBeenLastCalledWith('100');
        // nextTick needed since vm.loadProject is async, and we have to wait for it :/
        process.nextTick(() => (
            expect(mockedOnLoadedProject).toHaveBeenLastCalledWith(LoadingState.LOADING_VM_WITH_ID, false)
        ));
    });
    test('if the fontsLoaded prop is false, project data is never loaded', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const view = render(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        view.rerender(
            <WrappedComponent
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        expect(vm.loadProject).toHaveBeenCalledTimes(0);
        process.nextTick(() => expect(mockedOnLoadedProject).toHaveBeenCalledTimes(0));
    });
});

import React from 'react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {fireEvent, screen} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import mockAudioBufferPlayer from '../../__mocks__/audio-buffer-player.js';
import mockAudioEffects from '../../__mocks__/audio-effects.js';

import SoundEditor from '../../../src/containers/sound-editor';
import SoundEditorComponent from '../../../src/components/sound-editor/sound-editor';

jest.mock('react-ga');
jest.mock('../../../src/lib/audio/audio-buffer-player', () => mockAudioBufferPlayer);
jest.mock('../../../src/lib/audio/audio-effects', () => mockAudioEffects);

describe('Sound Editor Container', () => {
    const mockStore = configureStore();
    let store;
    let soundIndex;
    let soundBuffer;
    const samples = new Float32Array([0, 0, 0]); // eslint-disable-line no-undef
    let vm;

    beforeEach(() => {
        soundIndex = 0;
        soundBuffer = {
            numberOfChannels: 1,
            sampleRate: 0,
            getChannelData: jest.fn(() => samples)
        };
        vm = {
            getSoundBuffer: jest.fn(() => soundBuffer),
            renameSound: jest.fn(),
            updateSoundBuffer: jest.fn(),
            editingTarget: {
                sprite: {
                    sounds: [{name: 'first name', id: 'first id'}]
                }
            }
        };
        store = mockStore({scratchGui: {vm: vm, mode: {isFullScreen: false}}});
    });

    test('should pass the correct data to the component from the store', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        expect(screen.getByDisplayValue('first name')).toBeInTheDocument();
    });

    test('it plays when clicked and stops when clicked again', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        expect(mockAudioBufferPlayer.instance.play.mock.calls).toEqual([]);
        expect(mockAudioBufferPlayer.instance.stop.mock.calls).toEqual([]);

        fireEvent.click(screen.getByText('Play'));
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();

        mockAudioBufferPlayer.instance.onUpdate(0.5);

        fireEvent.click(screen.getByText('Stop'));
        expect(mockAudioBufferPlayer.instance.stop).toHaveBeenCalled();
    });

    test('it submits name changes to the vm', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        const input = screen.getByDisplayValue('first name');
        fireEvent.change(input, {target: {value: 'hello'}});
        fireEvent.blur(input);
        expect(vm.renameSound).toHaveBeenCalledWith(soundIndex, 'hello');
    });

    test('it handles an effect by submitting the result and playing', async () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Reverse'));
        await mockAudioEffects.instance._finishProcessing(soundBuffer);
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();
    });

    test('it handles reverse effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Reverse'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.REVERSE);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles louder effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Louder'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.LOUDER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles softer effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Softer'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.SOFTER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles faster effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Faster'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.FASTER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles slower effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Slower'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.SLOWER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles echo effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Echo'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.ECHO);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles robot effect correctly', () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        fireEvent.click(screen.getByText('Robot'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.ROBOT);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('undo/redo stack state', async () => {
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );

        fireEvent.click(screen.getByText('Faster'));
        await mockAudioEffects.instance._finishProcessing(soundBuffer);

        // Undo should update the sound buffer and play
        fireEvent.click(screen.getByText('Undo'));
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();

        vm.updateSoundBuffer.mockClear();
        mockAudioBufferPlayer.instance.play.mockClear();

        // Redo should also update the sound buffer and play
        fireEvent.click(screen.getByText('Redo'));
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();
    });

    test('isStereo numberOfChannels=1', () => {
        soundBuffer.numberOfChannels = 1;
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        expect(screen.getByText('Stereo')).toBeInTheDocument();
    });

    test('isStereo numberOfChannels=2', () => {
        soundBuffer.numberOfChannels = 2;
        renderWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        expect(screen.getByText('Stereo')).toBeInTheDocument();
    });
});

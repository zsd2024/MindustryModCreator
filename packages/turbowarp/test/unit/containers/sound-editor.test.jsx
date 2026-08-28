import React from 'react';
import {act, render} from '@testing-library/react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {fireEvent, screen} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import mockAudioBufferPlayer from '../../__mocks__/audio-buffer-player.js';
import mockAudioEffects from '../../__mocks__/audio-effects.js';

import SoundEditor from '../../../src/containers/sound-editor';

jest.mock('../../../src/lib/audio/audio-buffer-player', () => mockAudioBufferPlayer);
jest.mock('../../../src/lib/audio/audio-effects', () => mockAudioEffects);

const renderWithIntl = (ui, options = {}) => {
    const {locale = 'en', messages = {}, ...renderOptions} = options;
    return render(
        <IntlProvider locale={locale} messages={messages}>
            {ui}
        </IntlProvider>,
        renderOptions
    );
};

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
        store = mockStore({scratchGui: {
            vm: vm,
            mode: {isFullScreen: false},
            theme: {theme: {id: 1}}
        }});
    });

    const renderWithStore = (ui) => renderWithIntl(
        <Provider store={store}>{ui}</Provider>
    );

    test('should pass the correct data to the component from the store', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        expect(screen.getByDisplayValue('first name')).toBeInTheDocument();
    });

    test('it plays when clicked and stops when clicked again', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        expect(mockAudioBufferPlayer.instance.play.mock.calls).toEqual([]);
        expect(mockAudioBufferPlayer.instance.stop.mock.calls).toEqual([]);

        const playBtn = screen.getByTitle('Play');
        fireEvent.click(playBtn);
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();

        act(() => {
            mockAudioBufferPlayer.instance.onUpdate(0.5);
        });

        const stopBtn = screen.getByTitle('Stop');
        fireEvent.click(stopBtn);
        expect(mockAudioBufferPlayer.instance.stop).toHaveBeenCalled();
    });

    test('it submits name changes to the vm', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        const input = screen.getByDisplayValue('first name');
        fireEvent.change(input, {target: {value: 'hello'}});
        fireEvent.blur(input);
        expect(vm.renameSound).toHaveBeenCalledWith(soundIndex, 'hello');
    });

    test('it handles an effect by submitting the result and playing', async () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Reverse'));
        await mockAudioEffects.instance._finishProcessing(soundBuffer);
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();
    });

    test('it handles reverse effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Reverse'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.REVERSE);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles louder effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Louder'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.LOUDER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles softer effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Softer'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.SOFTER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles faster effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Faster'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.FASTER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles slower effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Slower'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.SLOWER);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles echo effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Echo'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.ECHO);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('it handles robot effect correctly', () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        fireEvent.click(screen.getByText('Robot'));
        expect(mockAudioEffects.instance.name).toEqual(mockAudioEffects.effectTypes.ROBOT);
        expect(mockAudioEffects.instance.process).toHaveBeenCalled();
    });

    test('undo/redo stack state', async () => {
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );

        fireEvent.click(screen.getByText('Faster'));
        await mockAudioEffects.instance._finishProcessing(soundBuffer);

        // Undo should update the sound buffer and play
        fireEvent.click(screen.getByTitle('Undo'));
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();

        vm.updateSoundBuffer.mockClear();
        mockAudioBufferPlayer.instance.play.mockClear();

        // Redo should also update the sound buffer and play
        await act(async () => {
            fireEvent.click(screen.getByTitle('Redo'));
            // Allow async operations (WavEncoder, downsampleIfNeeded) to settle
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(mockAudioBufferPlayer.instance.play).toHaveBeenCalled();
        expect(vm.updateSoundBuffer).toHaveBeenCalled();
    });

    test('isStereo numberOfChannels=1', () => {
        soundBuffer.numberOfChannels = 1;
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        expect(screen.getByText(/^Mono/)).toBeInTheDocument();
    });

    test('isStereo numberOfChannels=2', () => {
        soundBuffer.numberOfChannels = 2;
        renderWithStore(
            <SoundEditor
                soundIndex={soundIndex}
            />
        );
        expect(screen.getByText(/^Stereo/)).toBeInTheDocument();
    });
});

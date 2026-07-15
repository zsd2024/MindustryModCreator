/* global WebAudioTestAPI */
import 'web-audio-test-api';
WebAudioTestAPI.setState({
    'AudioContext#resume': 'enabled'
});

import SharedAudioContext from '../../../src/lib/audio/shared-audio-context';

describe('Shared Audio Context', () => {
    test('returns undefined without user gesture', () => {
        const audioContext = SharedAudioContext();
        expect(audioContext).toBeUndefined();
    });

    test('returns AudioContext after user gesture', () => {
        SharedAudioContext();
        // In jsdom ontouchstart is defined, so the module registers for touchstart
        const gestureEvent = typeof document.ontouchstart === 'undefined' ? 'mousedown' : 'touchstart';
        const event = new Event(gestureEvent);
        document.dispatchEvent(event);
        const audioContext = SharedAudioContext();
        expect(audioContext).toBeDefined();
        expect(audioContext.destination).toBeDefined();
        expect(audioContext.sampleRate).toBeDefined();
    });
});

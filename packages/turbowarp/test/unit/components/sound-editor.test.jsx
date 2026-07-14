import React from 'react';
import {renderWithIntl, componentWithIntl} from '../../helpers/intl-helpers.jsx';
import {fireEvent, screen} from '@testing-library/react';
import SoundEditor from '../../../src/components/sound-editor/sound-editor';

describe('Sound Editor Component', () => {
    let props;
    beforeEach(() => {
        props = {
            isStereo: false,
            duration: 1,
            size: 10507,
            canUndo: true,
            canRedo: false,
            chunkLevels: [1, 2, 3],
            name: 'sound name',
            playhead: 0.5,
            trimStart: 0.2,
            trimEnd: 0.8,
            onChangeName: jest.fn(),
            onDelete: jest.fn(),
            onPlay: jest.fn(),
            onRedo: jest.fn(),
            onReverse: jest.fn(),
            onSofter: jest.fn(),
            onLouder: jest.fn(),
            onRobot: jest.fn(),
            onEcho: jest.fn(),
            onFaster: jest.fn(),
            onSlower: jest.fn(),
            onSetTrimEnd: jest.fn(),
            onSetTrimStart: jest.fn(),
            onStop: jest.fn(),
            onUndo: jest.fn()
        };
    });

    test('matches snapshot', () => {
        const component = componentWithIntl(<SoundEditor {...props} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('delete button appears when selection is not null', () => {
        renderWithIntl(
            <SoundEditor
                {...props}
                trimEnd={0.75}
                trimStart={0.25}
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        expect(props.onDelete).toHaveBeenCalled();
    });

    test('play button appears when playhead is null', () => {
        renderWithIntl(
            <SoundEditor
                {...props}
                playhead={null}
            />
        );
        fireEvent.click(screen.getByTitle('Play'));
        expect(props.onPlay).toHaveBeenCalled();
    });

    test('stop button appears when playhead is not null', () => {
        renderWithIntl(
            <SoundEditor
                {...props}
                playhead={0.5}
            />
        );
        fireEvent.click(screen.getByTitle('Stop'));
        expect(props.onStop).toHaveBeenCalled();
    });

    test('submitting name calls the callback', () => {
        renderWithIntl(
            <SoundEditor {...props} />
        );
        const input = screen.getByDisplayValue('sound name');
        fireEvent.change(input, {target: {value: 'hello'}});
        fireEvent.blur(input);
        expect(props.onChangeName).toHaveBeenCalled();
    });

    test('effect buttons call the correct callbacks', () => {
        renderWithIntl(
            <SoundEditor {...props} />
        );

        fireEvent.click(screen.getByText('Reverse'));
        expect(props.onReverse).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Robot'));
        expect(props.onRobot).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Faster'));
        expect(props.onFaster).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Slower'));
        expect(props.onSlower).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Louder'));
        expect(props.onLouder).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Softer'));
        expect(props.onSofter).toHaveBeenCalled();
    });

    test('undo and redo buttons can be disabled by canUndo/canRedo', () => {
        const {unmount} = renderWithIntl(
            <SoundEditor
                {...props}
                canUndo
                canRedo={false}
            />
        );
        expect(screen.getByTitle('Undo')).not.toBeDisabled();
        expect(screen.getByTitle('Redo')).toBeDisabled();

        unmount();
        renderWithIntl(
            <SoundEditor
                {...props}
                canRedo
                canUndo={false}
            />
        );
        expect(screen.getByTitle('Undo')).toBeDisabled();
        expect(screen.getByTitle('Redo')).not.toBeDisabled();
    });
});

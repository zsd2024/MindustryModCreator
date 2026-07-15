import React from 'react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {fireEvent, screen} from '@testing-library/react';
import Controls from '../../../src/components/controls/controls';

describe('Controls component', () => {
    const defaultProps = () => ({
        active: false,
        onGreenFlagClick: jest.fn(),
        onStopAllClick: jest.fn(),
        turbo: false
    });

    test('shows turbo mode when in turbo mode', () => {
        const {unmount} = renderWithIntl(
            <Controls
                {...defaultProps()}
            />
        );
        expect(screen.queryByText('Turbo Mode')).toBeNull();
        unmount();
        renderWithIntl(
            <Controls
                {...defaultProps()}
                turbo
            />
        );
        expect(screen.getByText('Turbo Mode')).toBeInTheDocument();
    });

    test('triggers the right callbacks when clicked', () => {
        const props = defaultProps();
        renderWithIntl(
            <Controls
                {...props}
            />
        );
        fireEvent.click(screen.getByTitle('Go'));
        expect(props.onGreenFlagClick).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Stop'));
        expect(props.onStopAllClick).toHaveBeenCalled();
    });
});

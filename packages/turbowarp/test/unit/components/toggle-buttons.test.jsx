import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import ToggleButtons from '../../../src/components/toggle-buttons/toggle-buttons';

describe('ToggleButtons', () => {
    test('renders multiple buttons', () => {
        render(<ToggleButtons
            buttons={[
                {
                    title: 'Button 1',
                    handleClick: () => {},
                    icon: 'Button 1 icon'
                },
                {
                    title: 'Button 2',
                    handleClick: () => {},
                    icon: 'Button 2 icon'
                }
            ]}
        />);

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveAttribute('title', 'Button 1');
        expect(buttons[1]).toHaveAttribute('title', 'Button 2');
    });

    test('calls correct click handler', () => {
        const onClick1 = jest.fn();
        const onClick2 = jest.fn();
        render(<ToggleButtons
            buttons={[
                {
                    title: 'Button 1',
                    handleClick: onClick1,
                    icon: 'Button 1 icon'
                },
                {
                    title: 'Button 2',
                    handleClick: onClick2,
                    icon: 'Button 2 icon'
                }
            ]}
        />);
        fireEvent.click(screen.getByTitle('Button 2'));

        expect(onClick2).toHaveBeenCalled();
        expect(onClick1).not.toHaveBeenCalled();
    });
});

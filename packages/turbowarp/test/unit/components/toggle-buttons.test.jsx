import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import ToggleButtons from '../../../src/components/toggle-buttons/toggle-buttons';

const mockStore = configureStore();
const store = mockStore({
    scratchGui: {
        theme: {theme: {id: 1}}
    }
});

describe('ToggleButtons', () => {
    const renderWithStore = (ui) => render(
        <Provider store={store}>{ui}</Provider>
    );

    test('renders multiple buttons', () => {
        renderWithStore(<ToggleButtons
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
        renderWithStore(<ToggleButtons
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

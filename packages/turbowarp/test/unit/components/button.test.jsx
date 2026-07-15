import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import ButtonComponent from '../../../src/components/button/button';

const mockStore = configureStore();
const store = mockStore({
    scratchGui: {
        theme: {theme: {id: 1}}
    }
});

const renderWithStore = (ui) => render(<Provider store={store}>{ui}</Provider>);

describe('ButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const {container} = renderWithStore(
            <ButtonComponent onClick={onClick} />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        renderWithStore(
            <ButtonComponent onClick={onClick} />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });
});

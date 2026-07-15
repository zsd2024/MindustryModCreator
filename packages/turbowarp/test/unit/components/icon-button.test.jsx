import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import IconButton from '../../../src/components/icon-button/icon-button';

const mockStore = configureStore();
const store = mockStore({
    scratchGui: {
        theme: {theme: {id: 1}}
    }
});

const renderWithStore = (ui) => render(<Provider store={store}>{ui}</Provider>);

describe('IconButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const title = <div>Text</div>;
        const imgSrc = 'imgSrc';
        const className = 'custom-class-name';
        const {container} = renderWithStore(
            <IconButton
                className={className}
                img={imgSrc}
                title={title}
                onClick={onClick}
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        renderWithStore(
            <IconButton
                img={'imgSrc'}
                title={<div>Text</div>}
                onClick={onClick}
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });
});

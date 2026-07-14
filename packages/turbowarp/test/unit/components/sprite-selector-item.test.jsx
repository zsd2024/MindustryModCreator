import React from 'react';
import {renderWithIntl, componentWithIntl} from '../../helpers/intl-helpers.jsx';
import {fireEvent, screen} from '@testing-library/react';
import SpriteSelectorItemComponent from '../../../src/components/sprite-selector-item/sprite-selector-item';
import DeleteButton from '../../../src/components/delete-button/delete-button';

describe('SpriteSelectorItemComponent', () => {
    let className;
    let costumeURL;
    let name;
    let onClick;
    let onDeleteButtonClick;
    let selected;
    let number;
    let details;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getComponent = function () {
        return (
            <SpriteSelectorItemComponent
                className={className}
                costumeURL={costumeURL}
                details={details}
                name={name}
                number={number}
                selected={selected}
                onClick={onClick}
                onDeleteButtonClick={onDeleteButtonClick}
            />
        );
    };

    beforeEach(() => {
        className = 'ponies';
        costumeURL = 'https://scratch.mit.edu/foo/bar/pony';
        name = 'Pony sprite';
        onClick = jest.fn();
        onDeleteButtonClick = jest.fn();
        selected = true;
        // Reset to undefined since they are optional props
        number = undefined; // eslint-disable-line no-undefined
        details = undefined; // eslint-disable-line no-undefined
    });

    test('matches snapshot when selected', () => {
        const component = componentWithIntl(getComponent());
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('matches snapshot when given a number and details to show', () => {
        number = 5;
        details = '480 x 360';
        const component = componentWithIntl(getComponent());
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('does not have a close box when not selected', () => {
        selected = false;
        renderWithIntl(getComponent());
        expect(screen.queryByRole('button', {name: 'Delete'})).toBeNull();
    });

    test('triggers callback when Box component is clicked', () => {
        renderWithIntl(getComponent());
        fireEvent.click(screen.getByText('Pony sprite'));
        expect(onClick).toHaveBeenCalled();
    });

    test('triggers callback when CloseButton component is clicked', () => {
        renderWithIntl(getComponent());
        fireEvent.click(screen.getByRole('button', {name: 'Delete'}));
        expect(onDeleteButtonClick).toHaveBeenCalled();
    });

    test('it has a context menu with delete menu item and callback', () => {
        renderWithIntl(getComponent());
        const deleteItem = screen.getByText('delete');
        expect(deleteItem).toBeInTheDocument();
        fireEvent.click(deleteItem);
        expect(onDeleteButtonClick).toHaveBeenCalled();
    });
});

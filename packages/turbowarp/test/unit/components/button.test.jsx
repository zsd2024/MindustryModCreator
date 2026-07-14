import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import ButtonComponent from '../../../src/components/button/button';

describe('ButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const {container} = render(
            <ButtonComponent onClick={onClick} />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        render(
            <ButtonComponent onClick={onClick} />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });
});

import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import IconButton from '../../../src/components/icon-button/icon-button';

describe('IconButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const title = <div>Text</div>;
        const imgSrc = 'imgSrc';
        const className = 'custom-class-name';
        const {container} = render(
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
        render(
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

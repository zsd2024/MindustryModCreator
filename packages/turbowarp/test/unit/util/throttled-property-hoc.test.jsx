import React from 'react';
import {render, screen} from '@testing-library/react';

import ThrottledPropertyHOC from '../../../src/lib/throttled-property-hoc.jsx';

describe('VMListenerHOC', () => {
    const throttleTime = 500;
    const Component = ({propToThrottle, doNotThrottle}) => (
        <input
            name={doNotThrottle}
            value={propToThrottle}
            readOnly
        />
    );
    const WrappedComponent = ThrottledPropertyHOC('propToThrottle', throttleTime)(Component);

    let view;
    beforeEach(() => {
        global.Date.now = () => 0;

        view = render(
            <WrappedComponent
                doNotThrottle="oldvalue"
                propToThrottle={0}
            />
        );
    });

    test('it passes the props on initial render ', () => {
        expect(screen.getByDisplayValue('0')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    test('it does not rerender if throttled prop is updated too soon', () => {
        global.Date.now = () => throttleTime / 2;
        view.rerender(
            <WrappedComponent
                doNotThrottle="oldvalue"
                propToThrottle={1}
            />
        );
        expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    test('it does rerender if throttled prop is updated after throttle timeout', () => {
        global.Date.now = () => throttleTime * 2;
        view.rerender(
            <WrappedComponent
                doNotThrottle="oldvalue"
                propToThrottle={1}
            />
        );
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    test('it does rerender if a non-throttled prop is changed', () => {
        global.Date.now = () => throttleTime / 2;
        view.rerender(
            <WrappedComponent
                doNotThrottle="newvalue"
                propToThrottle={2}
            />
        );
        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });
});

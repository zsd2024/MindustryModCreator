import React from 'react';
import {render} from '@testing-library/react';
import Monitor from '../../../src/components/monitor/monitor';
import {Theme} from '../../../src/lib/themes';

describe('Monitor Component', () => {
    test('it renders with default theme', () => {
        const noop = () => {};

        const {container} = render(<Monitor
            category="motion"
            // eslint-disable-next-line react/jsx-no-bind
            componentRef={noop}
            draggable={false}
            label="My label"
            mode="default"
            // eslint-disable-next-line react/jsx-no-bind
            onDragEnd={noop}
            // eslint-disable-next-line react/jsx-no-bind
            onNextMode={noop}
            theme={Theme.light}
        />);

        expect(container.firstChild).not.toBeNull();
    });

    test('it renders with dark theme', () => {
        const noop = () => {};

        const {container} = render(<Monitor
            category="motion"
            // eslint-disable-next-line react/jsx-no-bind
            componentRef={noop}
            draggable={false}
            label="My label"
            mode="default"
            // eslint-disable-next-line react/jsx-no-bind
            onDragEnd={noop}
            // eslint-disable-next-line react/jsx-no-bind
            onNextMode={noop}
            theme={Theme.dark}
        />);

        expect(container.firstChild).not.toBeNull();
    });
});

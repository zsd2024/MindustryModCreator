import React from 'react';
import {render} from '@testing-library/react';
import Monitor from '../../../src/components/monitor/monitor';
import {DARK_THEME, DEFAULT_THEME} from '../../../src/lib/themes';

jest.mock('../../../src/lib/themes/default');
jest.mock('../../../src/lib/themes/dark');

describe('Monitor Component', () => {
    test('it selects the correct colors based on default theme', () => {
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
            theme={DEFAULT_THEME}
        />);

        // renders monitor with default theme colors
        expect(container.querySelector('[class*="monitor"]')).toBeInTheDocument();
    });

    test('it selects the correct colors based on dark mode theme', () => {
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
            theme={DARK_THEME}
        />);

        // renders monitor with dark theme colors
        expect(container.querySelector('[class*="monitor"]')).toBeInTheDocument();
    });
});

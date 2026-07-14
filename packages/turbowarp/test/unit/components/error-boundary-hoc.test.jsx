import React from 'react';
import {Provider} from 'react-redux';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

import configureStore from 'redux-mock-store';

import ErrorBoundary from '../../../src/containers/error-boundary.jsx';

const ChildComponent = () => <div>hello</div>;

describe('ErrorBoundary', () => {
    const mockStore = configureStore();
    let store;

    beforeEach(() => {
        store = mockStore({
            locales: {
                isRtl: false,
                locale: 'en-US'
            }
        });
    });

    test('ErrorBoundary shows children before error and CrashMessageComponent after', () => {
        const {container} = renderWithIntl(
            <Provider store={store}><ErrorBoundary action="test"><ChildComponent /></ErrorBoundary></Provider>
        );

        expect(container.textContent).toContain('hello');
    });
});

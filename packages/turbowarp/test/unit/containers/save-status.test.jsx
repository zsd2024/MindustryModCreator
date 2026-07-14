import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {fireEvent, screen} from '@testing-library/react';
import SaveStatus from '../../../src/components/menu-bar/save-status.jsx';
import {AlertTypes} from '../../../src/lib/alerts/index.jsx';

// Stub the manualUpdateProject action creator for later testing
jest.mock('../../../src/reducers/project-state', () => ({
    manualUpdateProject: jest.fn(() => ({type: 'stubbed'}))
}));

describe('SaveStatus container', () => {
    const mockStore = configureStore();

    test('if there are inline messages, they are shown instead of save now', () => {
        const store = mockStore({
            scratchGui: {
                projectChanged: true,
                alerts: {
                    alertsList: [
                        {alertId: 'saveSuccess', alertType: AlertTypes.INLINE}
                    ]
                }
            }
        });
        renderWithIntl(
            <Provider store={store}>
                <SaveStatus />
            </Provider>
        );
        expect(screen.queryByText('Save Now')).toBeNull();
    });

    test('save now is shown if there are project changes and no inline messages', () => {
        const store = mockStore({
            scratchGui: {
                projectChanged: true,
                alerts: {
                    alertsList: []
                }
            }
        });
        renderWithIntl(
            <Provider store={store}>
                <SaveStatus />
            </Provider>
        );

        expect(screen.getByText('Save Now')).toBeInTheDocument();

        // Clicking save now should dispatch the manualUpdateProject action (stubbed above)
        fireEvent.click(screen.getByText('Save Now'));
        expect(store.getActions()[0].type).toEqual('stubbed');
    });

    test('neither is shown if there are no project changes or inline messages', () => {
        const store = mockStore({
            scratchGui: {
                projectChanged: false,
                alerts: {
                    alertsList: []
                }
            }
        });
        renderWithIntl(
            <Provider store={store}>
                <SaveStatus />
            </Provider>
        );
        expect(screen.queryByText('Save Now')).toBeNull();
    });
});

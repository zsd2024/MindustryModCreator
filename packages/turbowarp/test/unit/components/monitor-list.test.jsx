import React from 'react';
import {OrderedMap} from 'immutable';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {screen} from '@testing-library/react';
import MonitorList from '../../../src/components/monitor-list/monitor-list.jsx';
import {Theme} from '../../../src/lib/themes';

describe('MonitorListComponent', () => {
    const store = configureStore()({scratchGui: {
        monitorLayout: {
            monitors: {},
            savedMonitorPositions: {}
        },
        theme: {
            theme: Theme.light
        },
        toolbox: {
            toolboxXML: ''
        },
        vm: {
            runtime: {
                requestUpdateMonitor: () => {},
                getLabelForOpcode: () => ''
            }
        }
    }});
    const draggable = false;
    const onMonitorChange = jest.fn();
    const stageSize = {
        width: 100,
        height: 100,
        widthDefault: 100,
        heightDefault: 100
    };

    let monitors = OrderedMap({});

    // Wrap this in a function so it gets test specific states and can be reused.
    const getComponent = function () {
        return (
            <Provider store={store}>
                <MonitorList
                    draggable={draggable}
                    monitors={monitors}
                    stageSize={stageSize}
                    onMonitorChange={onMonitorChange}
                />
            </Provider>
        );
    };

    test('it renders the correct step size for discrete sliders', () => {
        monitors = OrderedMap({
            id1: {
                visible: true,
                mode: 'slider',
                isDiscrete: true
            }
        });
        renderWithIntl(getComponent());
        const input = screen.getByRole('slider');
        expect(input).toHaveAttribute('step', '1');
    });

    test('it renders the correct step size for non-discrete sliders', () => {
        monitors = OrderedMap({
            id1: {
                visible: true,
                mode: 'slider',
                isDiscrete: false
            }
        });
        renderWithIntl(getComponent());
        const input = screen.getByRole('slider');
        expect(input).toHaveAttribute('step', '0.01');
    });
});

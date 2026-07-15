import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import SliderPrompt from '../../../src/containers/slider-prompt.jsx';

const mockStore = configureStore();
const store = mockStore({locales: {isRtl: false}});
const renderWithIntl = (ui) => render(
    <Provider store={store}>
        <IntlProvider locale="en">{ui}</IntlProvider>
    </Provider>
);

describe('Slider Prompt Container', () => {
    let onCancel;
    let onOk;

    beforeEach(() => {
        onCancel = jest.fn();
        onOk = jest.fn();
    });

    test('Min/max are shown with decimal when isDiscrete is false', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete={false}
                maxValue={100}
                minValue={0}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        const minInput = screen.getByDisplayValue('0.00');
        const maxInput = screen.getByDisplayValue('100.00');
        expect(minInput).toBeInTheDocument();
        expect(maxInput).toBeInTheDocument();
    });

    test('Min/max are NOT shown with decimal when isDiscrete is true', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete
                maxValue={100}
                minValue={0}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        expect(screen.getByDisplayValue('0')).toBeInTheDocument();
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    test('Entering a number with a decimal submits with isDiscrete=false', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete
                maxValue={100}
                minValue={0}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        fireEvent.change(screen.getByDisplayValue('0'), {target: {value: '1.0'}});
        fireEvent.click(screen.getByText('OK'));
        expect(onOk).toHaveBeenCalledWith(1, 100, false);
    });

    test('Entering integers submits with isDiscrete=true', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete={false}
                maxValue={100.1}
                minValue={12.32}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], {target: {value: '1'}});
        fireEvent.change(inputs[1], {target: {value: '2'}});
        fireEvent.click(screen.getByText('OK'));
        expect(onOk).toHaveBeenCalledWith(1, 2, true);
    });

    test('Enter button submits the form', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete={false}
                maxValue={100.1}
                minValue={12.32}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], {target: {value: '1'}});
        fireEvent.change(inputs[1], {target: {value: '2'}});
        fireEvent.keyDown(inputs[1], {key: 'Enter', code: 'Enter'});
        expect(onOk).toHaveBeenCalledWith(1, 2, true);
    });

    test('Validates number-ness before submitting', () => {
        renderWithIntl(
            <SliderPrompt
                isDiscrete={false}
                maxValue={100.1}
                minValue={12.32}
                onCancel={onCancel}
                onOk={onOk}
            />
        );
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], {target: {value: 'hello'}});
        fireEvent.click(screen.getByText('OK'));
        expect(onOk).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });
});

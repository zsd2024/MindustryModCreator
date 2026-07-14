import React from 'react';
import {IntlProvider} from 'react-intl';
import {render} from '@testing-library/react';

const renderWithIntl = (ui, options = {}) => {
    const {locale = 'en', messages = {}, ...renderOptions} = options;
    return render(
        <IntlProvider locale={locale} messages={messages}>
            {ui}
        </IntlProvider>,
        renderOptions
    );
};

export {
    renderWithIntl
};

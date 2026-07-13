import React from 'react';
import {FormattedMessage} from 'react-intl';

const Geolocate = () => (
    <div>
        <p>
            <FormattedMessage
                defaultMessage="The project wants to know your location."
                 
                description="Part of modal that appears when a project tries to geolocate the user using an extension"
                id="tw.geolocate.title"
            />
        </p>
        <p>
            <FormattedMessage
                 
                defaultMessage="If allowed, you may be prompted to allow location access by your browser."
                 
                description="Part of modal that appears when a project tries to geolocate the user using an extension"
                id="tw.geolocate.permission"
            />
        </p>
    </div>
);

export default Geolocate;

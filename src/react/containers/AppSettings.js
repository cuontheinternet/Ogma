/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {Helmet} from 'react-helmet';

class AppSettings extends React.Component {

    render() {
        return <div>
            <Helmet><title>Settings</title></Helmet>
            <h1 className="title">Settings</h1>
        </div>;
    };

}

export default AppSettings;

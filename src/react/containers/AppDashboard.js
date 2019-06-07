/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {Helmet} from 'react-helmet';
import {NotificationManager} from 'react-notifications';

import ErrorHandler from '../../util/ErrorHandler';

class AppDashboard extends React.Component {

    handleCreateEnvClick = () => {
        if (!window.dataManager.isLocalClient()) {
            NotificationManager.warning('Only local clients can create new collections.');
            return;
        }
        NotificationManager.info('Check other windows on your computer.',
            'The "create new collection" dialog is now open.');
        window.ipcModule.createEnvironment()
            .then(summary => {
                if (!summary) return null;

                const url = `/env/${summary.slug}`;
                this.props.history.push(url);
            })
            .catch(error => {
                window.hideGlobalLoader();
                return ErrorHandler.handleMiscError(error);
            });
    };

    render() {
        return <div>
            <Helmet><title>Dashboard</title></Helmet>
            <h1 className="title">Dashboard</h1>

            <button className="button" onClick={this.handleCreateEnvClick}>Create collection</button>
        </div>;
    };

}

export default AppDashboard;

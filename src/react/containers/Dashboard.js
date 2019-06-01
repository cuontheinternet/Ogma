/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import ErrorHandler from '../../util/ErrorHandler';

class Dashboard extends React.Component {

    handleCreateEnvClick = () => {
        window.showGlobalLoader('Creating collection...');
        window.ipcModule.createEnvironment()
            .then(summary => {
                window.hideGlobalLoader();
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
            <h1 className="title">Dashboard</h1>

            <button className="button" onClick={this.handleCreateEnvClick}>Create collection</button>
        </div>;
    };

}

export default Dashboard;

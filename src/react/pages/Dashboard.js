/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';

class Dashboard extends React.Component {

    handleCreateEnvClick() {
        window.dataManager.createNewEnvironment();
    }

    render() {
        return <div>
            <h1 className="title">Dashboard</h1>

            <button className="button" onClick={() => this.handleCreateEnvClick()}>Create collection</button>
        </div>;
    };

}

export default Dashboard;

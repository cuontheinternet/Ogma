/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import ExactTrie from 'exact-trie';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';
import {NotificationManager} from 'react-notifications';

import EnvIcon from '../components/EnvIcon';
import ErrorHandler from '../../util/ErrorHandler';
import Icon from '../components/Icon';

const BrowserIcons = {
    'b:chrome': ['Chrome'],
    'b:facebook': ['Facebook'],
    'b:firefox': ['Firefox'],
    'b:opera': ['Opera'],
    'b:safari': ['Safari', 'Mobile Safari'],
};
const BrowserIconTrie = new ExactTrie({ignoreCase: false});
for (const iconName in BrowserIcons) {
    BrowserIconTrie.putAll(BrowserIcons[iconName], iconName);
}

class AppDashboard extends React.Component {

    static propTypes = {
        // Props provided by redux.connect
        client: PropTypes.object.isRequired,
        connections: PropTypes.arrayOf(PropTypes.object).isRequired,
    };

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
            .catch(ErrorHandler.handleMiscError);
    };

    renderCollections() {
        return <button className="button" onClick={this.handleCreateEnvClick}>Create collection</button>;
    }

    renderActiveConnections() {
        const {client, connections} = this.props;

        const trs = new Array(connections.length);
        for (let i = 0; i < connections.length; ++i) {
            const conn = connections[i];
            const {os, browser} = conn.userAgent;
            const isSelf = conn.id === client.id;
            const className = isSelf ? 'active-connection' : '';

            const browserIcon = BrowserIconTrie.getWithCheckpoints(browser.name, ' ');
            trs[i] = <tr key={`connection-${conn.id}`}>
                <td>
                    <span className={className}>
                        {!!browserIcon && <Icon name={browserIcon}/>} <strong>{browser.name}</strong> on {os.name}
                    </span>
                    {isSelf && <span className="has-text-grey-light"> (this is you)</span>}
                </td>
                <td>{conn.ip}</td>
                <td>
                    <Icon name={conn.localClient ? 'laptop' : 'globe'}/>
                    &nbsp;&nbsp;{conn.localClient ? 'Local' : 'Web'} client
                </td>
            </tr>;
        }

        return <table className="table is-striped is-bordered">
            <thead>
            <tr>
                <th>Device</th>
                <th>IP</th>
                <th>Type</th>
            </tr>
            </thead>
            <tbody>{trs}</tbody>
        </table>;
    }

    render() {
        return <div className="dashboard">
            <Helmet><title>Dashboard</title></Helmet>
            <h1 className="title"><EnvIcon icon="tachometer-alt"/>&nbsp;&nbsp; Dashboard</h1>

            <h1 className="title is-size-5">Your collections</h1>
            {this.renderCollections()}

            <br/>

            <h1 className="title is-size-5">Active connections</h1>
            {this.renderActiveConnections()}
        </div>;
    };

}

export default connect(state => {
    return {
        client: state.client,
        connections: Object.values(state.connectionMap),
    };
})(AppDashboard);

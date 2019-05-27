/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {NavLink} from 'react-router-dom';

import OgmaIcon from '../../ogma-icon-128.png';
import Icon from '../helpers/Icon';

class Sidebar extends React.Component {

    constructor(props) {
        super(props);

        this.localClient = window.dataManager.isLocalClient();
    }


    render() {
        return (
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src={OgmaIcon} alt="Ogma Logo"/>Ogma <span>{this.localClient ? 'Local' : 'Web'}</span>
                </div>
                <aside className="menu">
                    <p className="menu-label">General</p>
                    <ul className="menu-list">
                        <li><NavLink activeClassName="is-active" to="/" exact>
                            <Icon name="home"/> Dashboard
                        </NavLink></li>
                        <li><NavLink activeClassName="is-active" to="/settings">
                            <Icon name="cog"/> Settings
                        </NavLink></li>
                    </ul>
                    <p className="menu-label">Collections</p>
                    <ul className="menu-list">
                        <li><NavLink activeClassName="is-active" to="/env" exact>
                            <Icon name="folder-open"/> Untitled
                        </NavLink></li>
                    </ul>
                </aside>
            </div>
        );
    };

}

export default Sidebar;

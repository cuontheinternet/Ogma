/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {NavLink} from 'react-router-dom';

import OgmaIcon from '../../ogma-icon-128.png';
import Icon from '../helpers/Icon';

class Sidebar extends React.Component {

    static propTypes = {
        envSummaries: PropTypes.array.isRequired,
    };

    constructor(props) {
        super(props);

        this.localClient = window.dataManager.isLocalClient();
    }

    renderCollections() {
        const summaries = this.props.envSummaries;

        const collections = new Array(summaries.length);
        for (let i = 0; i < summaries.length; ++i) {
            const s = summaries[i];
            const key = `sidebar-coll-${s.id}`;
            const url = `/env/${s.slug}`;
            collections[i] = (
                <li key={key}><NavLink activeClassName="is-active" to={url} exact>
                    <Icon name={s.icon}/>&nbsp; {s.name}
                </NavLink></li>
            );
        }
        return collections;
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
                            <Icon name="home"/>&nbsp; Dashboard
                        </NavLink></li>
                        <li><NavLink activeClassName="is-active" to="/settings">
                            <Icon name="cog"/>&nbsp; Settings
                        </NavLink></li>
                    </ul>
                    <p className="menu-label">Collections</p>
                    <ul className="menu-list">
                        {this.renderCollections()}
                    </ul>
                </aside>
            </div>
        );
    };

}

export default Sidebar;

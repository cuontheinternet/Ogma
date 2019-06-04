/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Switch, Route, withRouter, Redirect} from 'react-router-dom';

import EnvTag from './EnvTag';
import Tabs from '../components/Tabs';
import EnvIcon from '../components/EnvIcon';
import EnvConfigure from '../containers/EnvConfigure';
import {IndexRoutePath, EnvironmentContext, EnvRoutePaths} from '../../typedef';

const TabOptions = [
    {path: EnvRoutePaths.browse, exact: true, icon: 'eye', name: 'Browse'},
    {path: EnvRoutePaths.search, icon: 'search', name: 'Search'},
    {path: EnvRoutePaths.tag, icon: 'tag', name: 'Tag', comp: EnvTag},
    {path: EnvRoutePaths.configure, icon: 'cog', name: 'Configure', comp: EnvConfigure},
];
for (const option of TabOptions) option.id = option.path;

class Environment extends React.Component {

    static propTypes = {
        summary: PropTypes.object.isRequired,
        subRoute: PropTypes.string.isRequired,
    };

    componentDidMount() {
        // Immediately redirect to correct subroute if one isn't specified
        const props = this.props;
        const summary = props.summary;
        const pathName = props.location.pathname;
        const parentPath = props.match.url;
        if (pathName === parentPath) {
            console.log(props.subRoute);
            props.history.push(`${parentPath}${props.subRoute}`);
        } else {
            const hash = props.location.hash;
            const routePath = `/${path.relative(parentPath, pathName)}${hash}`;
            window.dataManager.setEnvRoutePath({id: summary.id, path: routePath});
        }
    }

    handleRouteChange = routePath => {
        // Remember the current subroute
        const summary = this.props.summary;
        window.dataManager.setEnvRoutePath({id: summary.id, path: routePath});
    };

    renderRoutes() {
        const props = this.props;
        const summary = props.summary;
        const comps = [];
        for (const tab of TabOptions) {
            if (!tab.comp) continue;
            const TabComp = tab.comp;
            const routePath = `${props.match.path}${tab.path}`;
            comps.push(<Route key={`env-router-${tab.path}`} path={routePath} exact={tab.exact}
                              render={props => <TabComp summary={summary} tabPath={tab.path} {...props}/>}/>);
        }
        return <Switch>{comps}</Switch>;
    }

    render() {
        const summary = this.props.summary;
        if (!summary) return <Redirect to={IndexRoutePath}/>;

        return <div className="env">
            <EnvironmentContext.Provider value={summary}>
                <h1 className="title">
                    <EnvIcon color={summary.color} icon={summary.icon}/>
                    &nbsp;&nbsp;{summary.name}
                </h1>

                <Tabs options={TabOptions} useLinks={true} basePath={this.props.match.url}
                      location={this.props.location} onOptionChange={this.handleRouteChange} className="is-boxed"/>

                {this.renderRoutes()}
            </EnvironmentContext.Provider>
        </div>;
    };

}

export default connect((state, ownProps) => {
    const env = _.find(state.envMap, e => e.summary.slug === ownProps.slug);
    return {
        summary: env ? env.summary : null,
        subRoute: env ? env.subRoute : null,
    };
})(withRouter(Environment));

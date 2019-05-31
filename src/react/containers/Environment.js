/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {Switch, Route, withRouter} from 'react-router-dom';

import EnvTag from './EnvTag';
import Tabs from '../components/Tabs';
import EnvIcon from '../components/EnvIcon';
import EnvConfigure from '../containers/EnvConfigure';
import {FrontendEvents, EnvRoutePaths, DefaultEnvRoutePath} from '../../typedef';

class Environment extends React.Component {

    static propTypes = {
        envSummaries: PropTypes.array.isRequired,
    };

    constructor(props) {
        super(props);

        const slug = this.props.match.params.slug;
        const summaries = this.props.envSummaries;
        const summary = _.find(summaries, s => s.slug === slug);

        this.state = {summary};

        this.tabOptions = [
            {path: EnvRoutePaths.browse, exact: true, icon: 'eye', name: 'Browse'},
            {path: EnvRoutePaths.search, icon: 'search', name: 'Search'},
            {path: EnvRoutePaths.tag, icon: 'tag', name: 'Tag', comp: EnvTag},
            {path: EnvRoutePaths.configure, icon: 'cog', name: 'Configure', comp: EnvConfigure},
        ];
        for (const option of this.tabOptions) option.id = option.path;
    }

    componentDidMount() {
        window.dataManager.subscribe(FrontendEvents.UpdateEnvSummary, this.updateEnvSummary);

        // Immediately redirect to correct subroute if one isn't specified
        const props = this.props;
        const parentPath = props.match.url;
        if (this.props.location.pathname === parentPath) {
            const summary = _.find(props.envSummaries, s => s.slug === props.match.params.slug);
            const envRoutePath = window.dataManager.getEnvRoutePath({id: summary.id}) || DefaultEnvRoutePath;
            props.history.push(`${parentPath}${envRoutePath}`);
        }
    }

    componentWillUnmount() {
        window.dataManager.unsubscribe(FrontendEvents.UpdateEnvSummary, this.updateEnvSummary);
    }

    updateEnvSummary = summary => {
        this.setState(prevState => ({
            ...prevState,
            summary,
        }));
    };

    handleRouteChange = routePath => {
        // Remember the current subroute
        window.dataManager.setEnvRoutePath({id: this.state.summary.id, path: routePath});
    };

    renderRoutes() {
        const comps = [];
        const parentPath = this.props.match.path;
        for (const tab of this.tabOptions) {
            if (!tab.comp) continue;
            const TabComp = tab.comp;
            comps.push(<Route key={`env-router-${tab.path}`} path={`${parentPath}${tab.path}`} exact={tab.exact}
                              render={props => <TabComp envSummary={this.state.summary} {...props}/>}/>);
        }
        return <Switch>{comps}</Switch>;
    }

    render() {
        const summary = this.state.summary;
        return <div className="env">
            <h1 className="title">
                <EnvIcon color={summary.color} icon={summary.icon}/>
                &nbsp;&nbsp;{summary.name}
            </h1>

            <Tabs options={this.tabOptions} useLinks={true} basePath={this.props.match.url}
                  location={this.props.location} onOptionChange={this.handleRouteChange} className="is-boxed"/>

            {this.renderRoutes()}
        </div>;
    };

}

export default withRouter(Environment);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {Switch, Route} from 'react-router-dom';

import Tabs from '../components/Tabs';
import EnvIcon from '../components/EnvIcon';
import {FrontendEvents} from '../../typedef';
import EnvConfigure from '../containers/EnvConfigure';

const TabOptions = [
    {path: '', exact: true, icon: 'eye', name: 'Browse', comp: null},
    {path: '/search', exact: false, icon: 'search', name: 'Search'},
    {path: '/tag', exact: false, icon: 'tag', name: 'Tag', comp: null},
    {path: '/configure', exact: false, icon: 'cog', name: 'Configure', comp: EnvConfigure},
];

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
    }

    updateEnvSummary = summary => {
        console.log(summary);
        this.setState(prevState => ({
            ...prevState,
            summary,
        }));
    };

    componentDidUpdate(nextProps) {
        const oldSlug = this.props.match.params.slug;
        const slug = nextProps.match.params.slug;

        if (slug !== oldSlug) {
            const summaries = this.props.envSummaries;
            const summary = _.find(summaries, s => s.slug === slug);
            this.updateEnvSummary(summary);
        }
    }

    componentDidMount() {
        window.dataManager.subscribe(FrontendEvents.UpdateEnvSummary, this.updateEnvSummary);
    }

    componentWillUnmount() {
        window.dataManager.unsubscribe(FrontendEvents.UpdateEnvSummary, this.updateEnvSummary);
    }

    renderRoutes() {
        const comps = [];
        const parentPath = this.props.match.path;
        for (const tab of TabOptions) {
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

            <Tabs options={TabOptions} useLinks={true} basePath={this.props.match.url}
                  location={this.props.location} className="is-boxed"/>

            {this.renderRoutes()}
        </div>;
    };

}

export default Environment;

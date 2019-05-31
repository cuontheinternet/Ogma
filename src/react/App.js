/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import LoadingOverlay from 'react-loading-overlay';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import {FrontendEvents} from '../typedef';
import Sidebar from './components/Sidebar';
import Dashboard from './containers/Dashboard';
import Environment from './containers/Environment';
import GlobalSettings from './containers/GlobalSettings';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showLoader: false,
            loaderText: 'Loading...',
            envSummaries: window.dataManager.getEnvSummaries(),
        };
    }

    updateEnvSummaries = (envSummaries) => {
        this.setState(prevState => ({
            ...prevState,
            envSummaries,
        }));
    };

    componentDidMount() {
        window.showGlobalLoader = text => {
            this.setState(prevState => ({
                ...prevState,
                showLoader: true,
                loaderText: text,
            }));
        };
        window.hideGlobalLoader = () => {
            this.setState(prevState => ({
                ...prevState,
                showLoader: false,
                loaderText: 'Loading...',
            }));
        };

        window.dataManager.subscribe(FrontendEvents.UpdateEnvSummaries, this.updateEnvSummaries);
    }

    componentWillUnmount() {
        window.dataManager.unsubscribe(FrontendEvents.UpdateEnvSummaries, this.updateEnvSummaries);
    }

    render() {
        const summaries = this.state.envSummaries;
        return (
            <Router>
                <LoadingOverlay
                    active={this.state.showLoader}
                    text={this.state.loaderText}
                    spinner>

                    <div className="app-wrapper">
                        <div className="columns">
                            <div className="column is-narrow"><Sidebar envSummaries={summaries}/></div>
                            <div className="column">
                                <div className="box">
                                    <Switch>
                                        <Route path="/" exact component={Dashboard}/>
                                        <Route path="/settings" component={GlobalSettings}/>
                                        <Route path="/env/:slug"
                                               render={props =>
                                                   <Environment {...props}
                                                                key={props.match.params.slug}
                                                                envSummaries={summaries}/>}/>
                                    </Switch>
                                </div>
                            </div>
                        </div>
                    </div>

                </LoadingOverlay>
            </Router>
        );
    }
}

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './containers/Dashboard';
import Environment from './containers/Environment';
import GlobalSettings from './containers/GlobalSettings';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showLoader: false,
            loaderText: 'Loading...',
        };
    }

    componentDidMount() {
        window.showGlobalLoader = text => {
            this.setState({
                showLoader: true,
                loaderText: text,
            });
        };
        window.hideGlobalLoader = () => {
            this.setState({showLoader: false});
        };
    }

    render() {
        const summaries = this.props.envSummaries;
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
                                                   <Environment {...props} key={props.match.params.slug}
                                                                slug={props.match.params.slug}/>
                                               }/>
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

export default connect(state => ({
    envSummaries: _.map(state.envMap, e => e.summary),
}))(App);

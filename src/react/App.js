/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import LoadingOverlay from 'react-loading-overlay';
import {BrowserRouter as Router, Route} from 'react-router-dom';


import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import GlobalSettings from './pages/GlobalSettings';

export default class App extends React.Component {

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
            this.setState({
                showLoader: false,
                loaderText: 'Loading...',
            });
        }
    }

    render() {
        return (
            <Router>
                <LoadingOverlay
                    active={this.state.showLoader}
                    text={this.state.loaderText}
                    spinner>

                    <div className="app-wrapper">
                        <div className="container">
                            <div className="columns">
                                <div className="column is-narrow"><Sidebar/></div>
                                <div className="column">
                                    <div className="box">
                                        <Route path="/" exact component={Dashboard}/>
                                        <Route path="/settings" component={GlobalSettings}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </LoadingOverlay>
            </Router>
        );
    }
}

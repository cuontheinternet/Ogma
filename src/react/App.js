/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {BrowserRouter as Router, Route} from 'react-router-dom';
import React from 'react';

import GlobalSettings from './pages/GlobalSettings';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

const App = () => {
    return (
        <Router>
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
        </Router>
    );
};

export default App;

/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal';

import Icon from '../components/Icon';
import Breadcrumbs from '../components/Breadcrumbs';

export default class EnvTag extends React.Component {

    static propTypes = {
        envSummary: PropTypes.object.isRequired,
        history: PropTypes.any,
    };

    constructor(props) {
        super(props);

        const summary = this.props.envSummary;
        this.state = {
            summary,
            currentPath: '/',
        };
    }

    componentDidUpdate(prevProps) {
        const summary = this.props.envSummary;
        const summaryChanged = !equal(prevProps.envSummary, summary);
        if (summaryChanged) {
            this.setState(prevState => ({
                ...prevState,
                summary,
                currentPath: '/',
            }));
        }
    }

    render() {
        return <div>

            <div className="level env-tag-top-bar">
                <div className="level-left">
                    <div className="level-item">
                        <Breadcrumbs/>
                    </div>
                </div>
                <div className="level-right">
                    <div className="level-item">
                        <div className="dropdown is-right is-hoverable">
                            <div className="dropdown-trigger">
                                <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                    <span>Options</span><Icon name="angle-down"/>
                                </button>
                            </div>
                            <div className="dropdown-menu" id="dropdown-menu" role="menu">
                                <div className="dropdown-content">
                                    <hr className="dropdown-divider"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }

}

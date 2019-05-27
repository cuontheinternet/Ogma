/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

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

    componentWillReceiveProps(nextProps) {
        const oldSlug = this.props.match.params.slug;
        const slug = nextProps.match.params.slug;

        if (slug !== oldSlug) {
            const summaries = this.props.envSummaries;
            const summary = _.find(summaries, s => s.slug === slug);
            this.setState(prevState => ({...prevState, summary}));
        }
    }


    render() {
        return <React.Fragment>
            <h1 className="title">{this.state.summary.name}</h1>
        </React.Fragment>;
    };

}

export default Environment;

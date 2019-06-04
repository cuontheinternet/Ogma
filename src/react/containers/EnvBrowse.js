/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import TagGroup from '../components/TagGroup';

class EnvBrowse extends React.Component {

    static propTypes = {
        tags: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);

        this.summary = props.summary;
    }

    renderTags() {
        const props = this.props;
        const tagIds = props.tagIds;
        return <div className="card env-browse-card">
            <div className="card-content">
                <p className="title is-size-5">Existing tags:</p>
                <TagGroup tagIds={tagIds} summary={this.summary}/>
            </div>
        </div>;
    }

    render() {
        return <div className="columns">
            <div className="column is-narrow" style={{width: 260}}>
                {this.renderTags()}
            </div>
            <div className="column">
                Files will be here.
            </div>
        </div>;
    };

}

export default connect((state, ownProps) => {
    const env = state.envMap[ownProps.summary.id];
    return {
        tagIds: env.tagIds,
        tagMap: env.tagMap,
    };
})(EnvBrowse);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {EnvironmentContext, EnvSummaryPropType} from '../../typedef';

class TagGroup extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,
        tagIds: PropTypes.arrayOf(PropTypes.object).isRequired,
        summary: EnvSummaryPropType.isRequired,
    };

    constructor(props) {
        super(props);
        this.summary = this.context;
    }

    renderTags() {
        const tags = this.props.tags;
        if (tags.length === 0) return;

        const comps = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            const style = {background: tag.color};
            comps[i] = <div key={tag.id} className="tag-group-tag" style={style}>{tag.name}</div>;
        }
        return comps;
    }

    render() {
        return <div className="tag-group">{this.renderTags()}</div>;
    };

}

export default connect((state, ownProps) => ({
    tags: _.map(ownProps.tagIds, tagId => state.envMap[ownProps.summary.id].tagMap[tagId]),
}))(TagGroup);

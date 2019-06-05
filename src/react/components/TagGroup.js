/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {EnvironmentContext, EnvSummaryPropType} from '../../util/typedef';

class TagGroup extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,
        entityId: PropTypes.string.isRequired,

        // Props provided by redux.connect
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,
    };

    constructor(props) {
        super(props);
        this.summary = this.context;
    }

    renderTags() {
        const tags = this.props.tags;
        if (!tags || tags.length === 0) return;

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

export default connect((state, ownProps) => {
    const {summary, entityId} = ownProps;
    const {tagMap, entityMap} = state.envMap[summary.id];
    const entity = entityMap[entityId];
    let tags = null;
    if (entity) tags = entity.tagIds ? _.map(entity.tagIds, tagId => tagMap[tagId]) : null;
    return {tags};
})(TagGroup);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import c from 'classnames';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {EnvironmentContext, EnvSummaryPropType} from '../../util/typedef';

class TagGroup extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        // Props used in redux.connect
        entityId: PropTypes.string,
        summary: EnvSummaryPropType.isRequired,
        tagIds: PropTypes.arrayOf(PropTypes.string),

        // Props provided by redux.connect
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,

        // Props passed by parent
        onClick: PropTypes.func,
        showEllipsis: PropTypes.bool,
        showPlaceHolderOnEmpty: PropTypes.bool,
    };

    static defaultProps = {
        showEllipsis: false,
        showPlaceHolderOnEmpty: false,
    };

    constructor(props) {
        super(props);
        this.summary = this.context;
    }

    renderTags() {
        const {tags, onClick, showEllipsis, showPlaceHolderOnEmpty} = this.props;
        if (!tags || tags.length === 0) {
            if (!showPlaceHolderOnEmpty) return;
            return <div className="tag-group-tag tag-group-tag-empty">Nothing to show</div>;
        }

        const badClassName = c({
            'tag-group-tag': true,
            'tag-group-tag-bad': true,
        });

        const className = c({
            'tag-group-tag': true,
            'text-ellipsis': showEllipsis,
            'clickable': !!onClick,
        });

        const comps = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            if (!tag) {
                comps[i] = <div key={`bad-tag-${i}`} className={badClassName}>Bad tag!</div>;
            }
            const style = {background: tag.color};
            const title = showEllipsis ? tag.name : null;
            comps[i] = <div key={tag.id} className={className} style={style}
                            title={title} onClick={() => onClick(tag.id)}>
                {tag.name}
            </div>;
        }
        return comps;
    }

    render() {
        return <div className="tag-group">{this.renderTags()}</div>;
    };

}

export default connect((state, ownProps) => {
    const {summary, tagIds, entityId} = ownProps;
    const {tagMap, entityMap} = state.envMap[summary.id];
    let finalTagIds;
    if (tagIds) {
        finalTagIds = tagIds;
    } else {
        const entity = entityMap[entityId];
        if (entity) finalTagIds = entity.tagIds;
    }
    const tags = finalTagIds ? finalTagIds.map(tagId => tagMap[tagId]) : null;
    return {tags};
})(TagGroup);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';

import {EnvSummaryPropType} from '../../typedef';

export default class TagGroup extends React.Component {

    static propTypes = {
        envSummary: EnvSummaryPropType.isRequired,
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    };

    renderTags() {
        const summary = this.props.envSummary;
        const tagIds = this.props.tagIds;
        if (tagIds.length === 0) return;

        console.log(tagIds);

        const comps = new Array(tagIds.length);
        for (let i = 0; i < tagIds.length; ++i) {
            const tagId = tagIds[i];
            const tag = window.dataManager.getTagDetails(summary.id, tagId);
            if (!tag) {
                comps[i] = <div key={tagId} className="tag-group-tag bad">Bad tag</div>;
            } else {
                const style = {background: tag.color};
                comps[i] = <div key={tagId} className="tag-group-tag" style={style}>{tag.name}</div>;
            }
        }
        return comps;
    }

    render() {
        return <div className="tag-group">{this.renderTags()}</div>;
    };

}
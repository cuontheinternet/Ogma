/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import TagGroup from '../components/TagGroup';

import {EnvSummaryPropType, ReduxActions} from '../../util/typedef';
import Icon from '../components/Icon';
import FileExplorer from '../components/FileExplorer';

class TabSearch extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        entityMap: PropTypes.object.isRequired,
        selectedTagsMap: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.summary = props.summary;
    }

    selectTag = tagId => {
        const actionData = {tagId, selected: true};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    deselectTag = tagId => {
        const actionData = {tagId, selected: false};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    renderAvailableTags(availableTags) {
        return <div className="card env-browse-available">
            <div className="card-content">
                <p className="title is-size-5">Available tags:</p>
                <div className="field has-addons">
                    <p className="control">
                        <button className="button is-static"><Icon name="search"/></button>
                    </p>
                    <p className="control is-expanded">
                        <input className="input" type="text" placeholder="Search tags"/>
                    </p>
                </div>
                <TagGroup tagIds={availableTags} summary={this.summary} onClick={this.selectTag}
                          showPlaceHolderOnEmpty={true}/>
            </div>
        </div>;
    }

    renderSelectedTags(selectedTags) {
        return <div className="env-browse-selected">
            <p className="is-pulled-left">Showing tags:</p>
            <TagGroup tagIds={selectedTags} summary={this.summary} onClick={this.deselectTag}
                      showPlaceHolderOnEmpty={true}/>
        </div>;
    }

    render() {
        const {tagIds, entityMap, selectedTagsMap} = this.props;
        const [selectedTags, availableTags] = _.partition(tagIds, id => !!selectedTagsMap[id]);

        const entityIds = Object.keys(entityMap);
        return <div className="columns">
            <div className="column is-narrow" style={{width: 360}}>
                {this.renderAvailableTags(availableTags)}
            </div>
            <div className="column">
                {this.renderSelectedTags(selectedTags)}
                <FileExplorer summary={this.summary} entityIds={entityIds}/>
            </div>
        </div>;
    };

}

export default connect((state, ownProps) => {
    const {tagIds, entityMap, tabSearch} = state.envMap[ownProps.summary.id];
    return {
        tagIds,
        entityMap,
        ...tabSearch,
    };
})(TabSearch);

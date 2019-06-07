/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';
import {ContextMenuWrapper} from 'react-context-menu-wrapper';

import {
    EnvSummaryPropType, ExplorerOptions as Options,
    ExplorerOptionsDefaults,
    MenuIds,
    ReduxActions,
    TagSearchCondition,
} from '../../util/typedef';
import Tabs from '../components/Tabs';
import Icon from '../components/Icon';
import TagGroup from '../components/TagGroup';
import FileExplorer from '../components/FileExplorer';
import TagContextMenu from '../components/TagContextMenu';

const SearchConditionOptions = [
    {id: TagSearchCondition.All, name: 'All'},
    {id: TagSearchCondition.Any, name: 'Any'},
];

class TabSearch extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        entityMap: PropTypes.object.isRequired,
        selectedTagsMap: PropTypes.object.isRequired,
        tagFilter: PropTypes.string.isRequired,
        tagSearchCondition: PropTypes.number.isRequired,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;

        this.state = {
            selection: {},
            contextFileHash: null,
            tagFilter: props.tagFilter,
            options: ExplorerOptionsDefaults,
        };
        this.debouncedTagFilterDispatch = _.debounce(tagFilter =>
            window.dataManager.dispatch(ReduxActions.TabSearchChangeTagFilter, this.summary.id, tagFilter), 100);
    }

    selectTag = tagId => {
        const actionData = {tagId, selected: true};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    deselectTag = tagId => {
        const actionData = {tagId, selected: false};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    handleTagFilterChange = tagFilter => {
        this.setState({tagFilter});
        this.debouncedTagFilterDispatch(tagFilter);
    };

    handleTagSearchConditionChange = conditionId => {
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSearchCondition, this.summary.id, conditionId);
    };

    handleSelectionChange = selection => {
        this.setState({selection});
    };

    handleContextMenuShow = data => {
        this.setState(prevState => {
            const newState = {contextFileHash: data};

            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            if (oldSelSize <= 1) {
                newState.selection = {};
                newState.selection[data] = true;
            }

            return newState;
        });
    };

    renderAvailableTags(availableTags) {
        const {tagFilter: propTagFilter} = this.props;
        const {tagFilter} = this.state;

        return <div className="card env-browse-available">
            <div className="card-content">
                <p className="title is-size-5">Available tags:</p>
                <div className="field has-addons">
                    <p className="control">
                        <button className="button is-static"><Icon name="search"/></button>
                    </p>
                    <p className="control is-expanded">
                        <input className="input" type="text" placeholder="Search tags" value={tagFilter}
                               onChange={event => this.handleTagFilterChange(event.target.value)}/>
                    </p>
                </div>
                <TagGroup tagIds={availableTags} summary={this.summary} onClick={this.selectTag}
                          showPlaceHolderOnEmpty={true} nameFilter={propTagFilter}/>
            </div>
        </div>;
    }

    renderSelectedTags(selectedTags) {
        const {tagSearchCondition} = this.props;

        return <div className="env-browse-selected">
            <div className="env-browse-selected-text">
                Showing files with
                <div style={{display: 'inline-block'}}>
                    <Tabs options={SearchConditionOptions} className="is-toggle" activeOption={tagSearchCondition}
                          onOptionChange={this.handleTagSearchConditionChange}/>
                </div>
                of the following tags:
            </div>
            <TagGroup tagIds={selectedTags} summary={this.summary} onClick={this.deselectTag}
                      showPlaceHolderOnEmpty={true}/>
        </div>;
    }

    render() {
        const {tagIds, entityMap, selectedTagsMap, tagSearchCondition, history} = this.props;
        const {options, contextFileHash, selection} = this.state;
        const [selectedTags, availableTags] = _.partition(tagIds, id => !!selectedTagsMap[id]);
        const selectedTagCount = _.size(selectedTagsMap);

        let relevantEntityIds;
        if (selectedTagCount === 0) {
            relevantEntityIds = Object.keys(entityMap);
        } else {
            const entities = Object.values(entityMap);
            let relevantEntities;
            if (tagSearchCondition === TagSearchCondition.Any) {
                relevantEntities = entities.filter(e => e.tagIds.some(id => !!selectedTagsMap[id]));
            } else if (tagSearchCondition === TagSearchCondition.All) {
                const selectedTagIds = Object.keys(selectedTagsMap);
                relevantEntities = entities.filter(e => _.intersection(e.tagIds, selectedTagIds).length === selectedTagCount);
            } else {
                console.warn('Unknown "tagSearchCondition" specified in TabSearch!');
            }
            relevantEntityIds = relevantEntities.map(e => e.id);
        }
        return <div className="columns">
            <Helmet><title>Search</title></Helmet>
            <div className="column is-narrow" style={{width: 360}}>
                {this.renderAvailableTags(availableTags)}
            </div>
            <div className="column">
                {this.renderSelectedTags(selectedTags)}
                <FileExplorer summary={this.summary} entityIds={relevantEntityIds} selectedFileHash={contextFileHash}
                              onSelectionChange={this.handleSelectionChange} contextMenuId={MenuIds.TabSearch}/>
            </div>

            <ContextMenuWrapper id={MenuIds.TabSearch} hideOnSelfClick={false} onShow={this.handleContextMenuShow}>
                <TagContextMenu id={MenuIds.TabSearch} fileHash={contextFileHash}
                                summary={this.summary} selection={selection} allowShowInBrowseTab={true}
                                confirmDeletions={options[Options.ConfirmDeletions]} history={history}/>
            </ContextMenuWrapper>
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

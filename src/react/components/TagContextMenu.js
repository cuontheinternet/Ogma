/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import path from 'path';
import React from 'react';
import Denque from 'denque';
import Promise from 'bluebird';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import ReactTags from 'react-tag-autocomplete';
import {hideAllContextMenus} from 'react-context-menu-wrapper';

import Tabs from './Tabs';
import Icon from './Icon';
import Util from '../../util/Util';
import ModalUtil from '../../util/ModalUtil';
import {EnvironmentContext, EnvRoutePaths} from '../../util/typedef';

const ContextTabs = {
    Tag: 0,
    File: 1,
};

const BaseTabOptions = [
    {id: ContextTabs.Tag, icon: 'tag', name: 'Tags'},
    {id: ContextTabs.File, icon: 'file', name: 'File'},
];

class TagContextMenu extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        // Props used in redux.connect
        fileHash: PropTypes.string,
        summary: PropTypes.object.isRequired,
        selection: PropTypes.object.isRequired,

        // Props provided by redux.connect
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,
        files: PropTypes.arrayOf(PropTypes.object).isRequired,
        entityIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        selectedTags: PropTypes.arrayOf(PropTypes.object).isRequired,

        // Props passed by parent
        id: PropTypes.string.isRequired,
        changePath: PropTypes.func,
        allowShowInBrowseTab: PropTypes.bool,
        confirmDeletions: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        allowShowInBrowseTab: false,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        this.tabOptionsTemplate = Util.deepClone(BaseTabOptions);

        this.state = {
            selectedTags: [],
            activeTab: ContextTabs.Tag,
            tabOptions: this.tabOptionsTemplate,
        };

        this.tagAddQueue = new Denque();
        this.tagDeleteQueue = new Denque();
        this.debouncedCommitTagAddition = _.debounce(this.commitTagAddition, 50);
        this.debouncedCommitTagDeletion = _.debounce(this.commitTagDeletion, 50);
    }

    static getDerivedStateFromProps(props, state) {
        const {files, selectedTags} = props;
        const fileCount = files.length;
        const isMult = files.length > 1;
        const firstFile = files[0];

        const tagTab = state.tabOptions[0];
        const fileTab = state.tabOptions[1];

        if (isMult) {
            fileTab.icon = 'copy';
            fileTab.name = `Selection (${fileCount})`;
        } else if (firstFile) {
            if (firstFile.isDir) {
                fileTab.icon = 'folder';
                fileTab.name = 'Folder';
            } else {
                fileTab.icon = 'file';
                fileTab.name = 'File';
            }
        }

        return {
            selectedTags,
            tabOptions: [tagTab, fileTab],
        };
    }

    handleTabChange = contextTab => {
        this.setState({activeTab: contextTab});
    };

    commitTagAddition = () => {
        const {files} = this.props;
        const id = this.summary.id;
        const queue = this.tagAddQueue;
        this.tagAddQueue = new Denque();
        const tagNames = new Array(queue.length);
        for (let i = 0; i < queue.length; ++i) {
            tagNames[i] = queue.pop().name;
        }
        const paths = files.map(f => f.nixPath);
        window.ipcModule.addTagsToFiles({id, tagNames, paths})
            .catch(window.handleError);
    };

    commitTagDeletion = () => {
        const {entityIds} = this.props;
        const id = this.summary.id;
        const queue = this.tagDeleteQueue;
        this.tagDeleteQueue = new Denque();
        const tagIds = new Array(queue.length);
        for (let i = 0; i < queue.length; ++i) {
            tagIds[i] = queue.pop().id;
        }
        window.ipcModule.removeTagsFromFiles({id, tagIds, entityIds})
            .catch(window.handleError);
    };

    handleTagAddition = tag => {
        const selectedTags = [].concat(this.state.selectedTags, tag);
        this.setState({selectedTags});

        this.tagAddQueue.push(tag);
        this.debouncedCommitTagAddition();
    };

    handleTagDeletion = tagIndex => {
        const selectedTags = this.state.selectedTags.slice(0);
        const tag = selectedTags.splice(tagIndex, 1)[0];
        this.setState({selectedTags});

        this.tagDeleteQueue.push(tag);
        this.debouncedCommitTagDeletion();
    };

    getHandler(promiseFunc, hideMenu = false) {
        return () => {
            if (hideMenu) hideAllContextMenus();
            Promise.resolve()
                .then(() => promiseFunc())
                .catch(window.handleError);
        };
    };

    renderDropdownButtons(buttons) {
        const comps = new Array(buttons.length);

        for (let i = 0; i < buttons.length; ++i) {
            const button = buttons[i];
            if (!button) continue;

            comps[i] = <button key={button.name} className="dropdown-item text-ellipsis" onClick={button.onClick}>
                <Icon name={button.icon}/> {button.name}
            </button>;
        }

        return comps;
    }

    renderTagOptions() {
        const files = this.props.files;
        const fileCount = files.length;
        if (fileCount === 0) return null;

        const hasFolders = _.findIndex(files, f => f.isDir) !== -1;

        if (hasFolders) {
            return <div className="dropdown-item">
                <p><Icon name="exclamation-triangle"/> Your selection contains folders. Folder tagging is not supported
                    yet.</p>
            </div>;
        }

        return <React.Fragment>
            <ReactTags tags={this.state.selectedTags} suggestions={this.props.tags}
                       handleDelete={this.handleTagDeletion} handleAddition={this.handleTagAddition} minQueryLength={1}
                       allowNew={true} allowBackspace={false} placeholder="Add tag"/>
        </React.Fragment>;
    }

    renderFileOptions() {
        const {files, changePath, allowShowInBrowseTab, history} = this.props;
        const fileCount = files.length;
        if (fileCount === 0) return null;

        const s = this.summary;
        const ipc = window.ipcModule;
        const isMult = files.length > 1;
        const hasFolders = _.findIndex(files, f => f.isDir) !== -1;

        const firstFile = files[0];
        const firstFileReqData = {id: s.id, path: firstFile.nixPath};

        const buttons = new Array(5);

        if (!isMult) {
            const file = firstFile;
            const isDir = file.isDir;
            if (!isDir || changePath) {
                const openContent = <React.Fragment>Open <strong>{file.base}</strong></React.Fragment>;
                const openFunc = isDir ? () => this.props.changePath(file.nixPath) : () => ipc.openFile(firstFileReqData);
                buttons[0] = {
                    icon: 'envelope-open-text', name: openContent,
                    onClick: this.getHandler(openFunc, true),
                };
            }

            if (allowShowInBrowseTab) {
                const urlPart = path.join(`/env/${s.slug}`, EnvRoutePaths.browse);
                const hashPart = path.dirname(file.nixPath);
                buttons[1] = {
                    icon: 'eye', name: 'Show in browse tab',
                    onClick: () => history.push(`${urlPart}#${hashPart}`),
                };
            }

            buttons[3] = {icon: 'i-cursor', name: 'Rename', onClick: null};
        }

        if (window.dataManager.isLocalClient()) {
            buttons[2] = {
                icon: 'external-link-alt', name: 'Show in files',
                onClick: this.getHandler(() => ipc.openInExplorer(firstFileReqData), true),
            };
        }

        const removeFunc = () => {
            let removeTitle;
            let removeText;
            if (isMult) {
                removeTitle = `Move ${files.length} files to trash?`;

                const count = 5;
                const names = _.map(files.slice(0, count), f => Util.truncate(f.base, 40));
                removeText = `Files are "${names.join('", "')}"`;
                if (count < fileCount) removeText += ` and ${fileCount - count} others.`;
                else removeText += '.';

                if (hasFolders) removeText += ' Some of them are folders.';
            } else {
                const objName = firstFile.isDir ? 'folder' : 'file';
                removeTitle = `Move ${objName} to trash?`;
                removeText = `The ${objName} is "${Util.truncate(firstFile.base, 40)}".`;
            }
            return Promise.resolve()
                .then(() => {
                    if (!this.props.confirmDeletions) return true;

                    return ModalUtil.confirm({
                        title: removeTitle,
                        text: removeText,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No, cancel',
                    });
                })
                .then(result => {
                    if (!result) return null;
                    return ipc.removeFiles({id: s.id, paths: _.map(files, f => f.nixPath)});
                });
        };
        buttons[4] = {
            icon: 'trash', name: 'Move to trash',
            onClick: this.getHandler(removeFunc, true),
        };

        return this.renderDropdownButtons(buttons);
    }

    render() {
        const state = this.state;

        let tabContent;
        if (state.activeTab === ContextTabs.Tag) tabContent = this.renderTagOptions();
        else if (state.activeTab === ContextTabs.File) tabContent = this.renderFileOptions();

        return (
            <div className="context-menu dropdown is-active">

                <Tabs options={state.tabOptions} size="small" activeOption={state.activeTab}
                      fullwidth={true} onOptionChange={this.handleTabChange}/>

                <div className="dropdown-menu" id="dropdown-menu" role="menu">
                    <div className="dropdown-content">
                        {tabContent}

                        {!tabContent && tabContent === null &&
                        <div className="dropdown-item"><Icon name="eye-slash"/> Tab content hidden.</div>}

                        {!tabContent && tabContent !== null &&
                        <div className="dropdown-item"><Icon name="radiation-alt"/> Invalid context tab option!</div>}
                    </div>
                </div>

            </div>
        );
    };

}


export default connect((state, ownProps) => {
    const {summary, selection, fileHash} = ownProps;
    const {tagIds, tagMap, entityMap, fileMap} = state.envMap[summary.id];

    const selectedHashes = Object.keys(selection);
    let files = [];
    if (selectedHashes.length === 1) files = [fileMap[fileHash]];
    else files = selectedHashes.map(h => fileMap[h]);
    files = files.filter(f => !!f);

    const entityIds = files.map(f => f.entityId).filter(e => !!e);
    const entities = entityIds.map(id => entityMap[id]);
    const selectedTagIds = _.union(...entities.map(e => e.tagIds));
    const selectedTags = _.map(selectedTagIds, tagId => tagMap[tagId]);

    const tags = tagIds.map(tagId => tagMap[tagId]);
    return {tags, entityIds, selectedTags, files};
})(withRouter(TagContextMenu));

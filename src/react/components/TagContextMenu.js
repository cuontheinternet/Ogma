/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import Denque from 'denque';
import Promise from 'bluebird';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ReactTags from 'react-tag-autocomplete';
import {hideAllContextMenus} from 'react-context-menu-wrapper';

import Tabs from './Tabs';
import Icon from './Icon';
import Util from '../../util/Util';
import ModalUtil from '../../util/ModalUtil';
import {EnvironmentContext} from '../../util/typedef';

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
        id: PropTypes.string.isRequired,
        fileHash: PropTypes.string,
        changePath: PropTypes.func.isRequired,
        selection: PropTypes.object.isRequired,
        confirmDeletions: PropTypes.bool.isRequired,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        this.tabOptionsTemplate = Util.deepClone(BaseTabOptions);

        this.state = {
            activeTab: ContextTabs.Tag,
            tabOptions: this.tabOptionsTemplate,

            tags: [],
        };

        this.tagAddQueue = new Denque();
        this.tagDeleteQueue = new Denque();
        this.debouncedCommitTagAddition = _.debounce(this.commitTagAddition, 50);
        this.debouncedCommitTagDeletion = _.debounce(this.commitTagDeletion, 50);
    }

    static getDerivedStateFromProps(props, state) {
        const files = props.files;
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

        const tagIds = _.union(..._.map(files, f => f.tagIds));
        const selectedTags = _.map(tagIds, tagId => props.tagMap[tagId]);

        return {
            files,
            tags: selectedTags,
            selection: props.selection,
            tabOptions: [tagTab, fileTab],
        };
    }

    handleTabChange = contextTab => {
        this.setState({activeTab: contextTab});
    };

    commitTagAddition = () => {
        const id = this.summary.id;
        const queue = this.tagAddQueue;
        this.tagAddQueue = new Denque();
        const tagNames = new Array(queue.length);
        for (let i = 0; i < queue.length; ++i) {
            tagNames[i] = queue.pop().name;
        }
        const paths = _.map(this.state.files, f => f.nixPath);
        window.ipcModule.addTagsToFiles({id, tagNames, paths})
            .catch(window.handleError);
    };

    commitTagDeletion = () => {
        const id = this.summary.id;
        const queue = this.tagDeleteQueue;
        this.tagDeleteQueue = new Denque();
        const tagIds = new Array(queue.length);
        for (let i = 0; i < queue.length; ++i) {
            tagIds[i] = queue.pop().id;
        }
        const entityIds = _.map(this.state.files, f => f.entityId);
        window.ipcModule.removeTagsFromFiles({id, tagIds, entityIds})
            .catch(window.handleError);
    };

    handleTagAddition = tag => {
        const tags = [].concat(this.state.tags, tag);
        this.setState({tags});

        this.tagAddQueue.push(tag);
        this.debouncedCommitTagAddition();
    };

    handleTagDeletion = tagIndex => {
        const tags = this.state.tags.slice(0);
        const tag = tags.splice(tagIndex, 1)[0];
        this.setState({tags});

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
        const files = this.state.files;
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
            <ReactTags tags={this.state.tags} suggestions={this.props.tags}
                       handleDelete={this.handleTagDeletion} handleAddition={this.handleTagAddition} minQueryLength={1}
                       allowNew={true} allowBackspace={false} placeholder="Add tag"/>
        </React.Fragment>;
    }

    renderFileOptions() {
        const files = this.state.files;
        const fileCount = files.length;
        if (fileCount === 0) return null;

        const s = this.summary;
        const ipc = window.ipcModule;
        const isMult = files.length > 1;
        const hasFolders = _.findIndex(files, f => f.isDir) !== -1;

        const firstFile = files[0];
        const firstFileReqData = {id: s.id, path: firstFile.nixPath};

        const buttons = new Array(4);

        if (!isMult) {
            const file = firstFile;
            const isDir = file.isDir;
            const openContent = <React.Fragment>Open <strong>{file.base}</strong></React.Fragment>;
            const openFunc = isDir ? () => this.props.changePath(file.nixPath) : () => ipc.openFile(firstFileReqData);
            buttons[0] = {
                icon: 'envelope-open-text', name: openContent,
                onClick: this.getHandler(openFunc, true),
            };
            buttons[2] = {icon: 'i-cursor', name: 'Rename', onClick: null};
        }

        buttons[1] = {
            icon: 'external-link-alt', name: 'Show in files',
            onClick: this.getHandler(() => ipc.openInExplorer(firstFileReqData), true),
        };

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
        buttons[3] = {
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
    const fileMap = state.envMap[ownProps.summary.id].fileMap;
    const selectedHashes = Object.keys(ownProps.selection);
    let files = [];
    if (selectedHashes.length === 1) files = [fileMap[ownProps.fileHash]];
    else files = _.map(selectedHashes, h => fileMap[h]);
    files = _.filter(files, f => !!f);

    const tagMap = state.envMap[ownProps.summary.id].tagMap;
    const tags = Object.values(tagMap);
    return {tags, tagMap, files};
})(TagContextMenu);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import Promise from 'bluebird';
import PropTypes from 'prop-types';
import {hideAllContextMenus} from 'react-context-menu-wrapper';

import Tabs from './Tabs';
import Icon from './Icon';
import {FilePropType} from '../../typedef';
import ModalUtil from '../../util/ModalUtil';
import Util from '../../util/Util';

const ContextTabs = {
    Tag: 0,
    File: 1,
};

const BaseTabOptions = [
    {id: ContextTabs.Tag, icon: 'tag', name: 'Tags'},
    {id: ContextTabs.File, icon: 'file', name: 'File'},
];

export default class TagContextMenu extends React.Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        file: FilePropType,
        changePath: PropTypes.func.isRequired,
        selection: PropTypes.object.isRequired,
        envSummary: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.tabOptionsTemplate = Util.deepClone(BaseTabOptions);

        this.state = {
            summary: props.envSummary,
            activeTab: ContextTabs.Tag,
            tabOptions: this.tabOptionsTemplate,
        };
    }

    static getDerivedStateFromProps(props, state) {
        const file = props.file;

        // const selectionSize = Util.objectLength(props.selection, null, val => !!val);
        const selectionSize = _.size(props.selection);
        const isMult = selectionSize > 1;

        let files;
        if (isMult) files = Object.values(props.selection);
        else files = [file];

        _.remove(files, f => !f);
        const firstFile = files[0];

        const tagTab = state.tabOptions[0];
        const fileTab = state.tabOptions[1];

        if (isMult) {
            fileTab.icon = 'copy';
            fileTab.name = `Selection (${selectionSize})`;
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
            files,
            summary: props.envSummary,
            selection: props.selection,
            tabOptions: [tagTab, fileTab],
        };
    }

    handleTabChange = contextTab => {
        this.setState({activeTab: contextTab});
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
        return <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
                <div className="dropdown-item">
                    <p>Tagging functionality will be here very <em>very</em> <strong>soon(tm)</strong>.</p>
                </div>
            </div>
        </div>;
    }

    renderSelectionOptions() {
        const buttons = [
            {icon: 'question', name: 'Do something with selection...', onClick: null},
        ];
        return <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
                {this.renderDropdownButtons(buttons)}
            </div>
        </div>;
    }

    renderFileOptions() {
        const files = this.state.files;
        const fileCount = files.length;
        if (fileCount === 0) return;

        const s = this.state.summary;
        const ipc = window.ipcModule;
        const isMult = files.length > 1;

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

                const hasFolders = _.findIndex(files, f => f.isDir) !== -1;
                if (hasFolders) removeText += ' Some of them are folders.';
            } else {
                const objName = firstFile.isDir ? 'folder' : 'file';
                removeTitle = `Move ${objName} to trash?`;
                removeText = `The ${objName} is "${Util.truncate(firstFile.base, 40)}".`;
            }
            return ModalUtil.confirm({
                title: removeTitle,
                text: removeText,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No, cancel',
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

        return <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
                {this.renderDropdownButtons(buttons)}
            </div>
        </div>;
    }

    render() {
        const state = this.state;

        let tabContent;
        switch (state.activeTab) {
            case ContextTabs.Tag:
                tabContent = this.renderTagOptions();
                break;
            case ContextTabs.Selection:
                tabContent = this.renderSelectionOptions();
                break;
            case ContextTabs.File:
                tabContent = this.renderFileOptions();
                break;
            default:
                tabContent = <div>Invalid context tab option!</div>;
        }

        return (
            <div className="context-menu dropdown is-active">

                <Tabs options={state.tabOptions} size="small" activeOption={state.activeTab}
                      fullwidth={true} onOptionChange={this.handleTabChange}/>

                {tabContent}

            </div>
        );
    };

}
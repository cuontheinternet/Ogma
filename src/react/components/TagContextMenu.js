/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import Promise from 'bluebird';
import PropTypes from 'prop-types';
import {hideAllContextMenus} from 'react-context-menu-wrapper';

import Tabs from './Tabs';
import Icon from './Icon';
import {FilePropType} from '../../typedef';
import WindowUtil from '../../util/WindowUtil';

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

        this.tabOptionsTemplate = WindowUtil.deepClone(BaseTabOptions);

        this.state = {
            file: props.file,
            summary: props.envSummary,
            selection: props.selection,
            activeTab: ContextTabs.Tag,
            tabOptions: this.tabOptionsTemplate,
        };
    }

    static getDerivedStateFromProps(props, state) {
        const file = props.file;
        if (!file) return null;

        const tagTab = state.tabOptions[0];
        const fileTab = state.tabOptions[1];

        const selectionSize = WindowUtil.objectLength(props.selection, null, val => val === true);
        const isMult = selectionSize > 1;

        if (file.isDir) {
            fileTab.icon = isMult ? 'folder-plus' : 'folder';
            fileTab.name = 'Folder';
        } else {
            fileTab.icon = isMult ? 'file-medical' : 'file';
            fileTab.name = 'File';
        }
        if (isMult) fileTab.name += `s (${selectionSize})`;

        return {
            file: props.file,
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
        const s = this.state.summary;
        const ipc = window.ipcModule;
        const file = this.state.file;
        const isDir = file.isDir;
        const fileReqData = {id: s.id, path: file.nixPath};

        const openContent = <React.Fragment>Open <strong>{file.base}</strong></React.Fragment>;
        const openFunc = isDir ? () => this.props.changePath(file.nixPath) : () => ipc.openFile(fileReqData);
        const buttons = [
            {
                icon: 'envelope-open-text', name: openContent,
                onClick: this.getHandler(openFunc, true),
            },
            {
                icon: 'external-link-alt', name: 'Show in files',
                onClick: this.getHandler(() => ipc.openInExplorer(fileReqData), true),
            },
            {icon: 'i-cursor', name: 'Rename', onClick: null},
            {
                icon: 'trash', name: 'Move to trash',
                onClick: this.getHandler(() => ipc.removeFile(fileReqData), true),
            },
        ];
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
/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import _ from 'lodash';
import path from 'path';
import upath from 'upath';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {ContextMenuWrapper} from 'react-context-menu-wrapper';

import Icon from '../components/Icon';
import ModalUtil from '../../util/ModalUtil';
import Checkbox from '../components/Checkbox';
import Breadcrumbs from '../components/Breadcrumbs';
import FileExplorer from '../components/FileExplorer';
import TagContextMenu from '../components/TagContextMenu';
import {EnvironmentContext, MenuIds, ExplorerOptions, ExplorerOptionsDefaults, ReduxActions} from '../../util/typedef';

const Options = ExplorerOptions;

class EnvTag extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        history: PropTypes.any,
        tabPath: PropTypes.string.isRequired,

        path: PropTypes.string.isRequired,
        rootDirName: PropTypes.string.isRequired,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        this.state = {
            selection: {},
            contextFileHash: null,
            breadcrumbs: this.pathToBreadcrumbs(props.path),

            optionState: ExplorerOptionsDefaults,
        };
        this.optionCheckboxes = [
            {id: Options.CollapseLong, name: 'Collapse long names'},
            {id: Options.FoldersFirst, name: 'Show folders first'},
            {id: Options.ShowExtensions, name: 'Show extensions'},
            {id: Options.ShowHidden, name: 'Show hidden files'},
            {id: Options.ConfirmDeletions, name: 'Confirm deletions'},
        ];
        this.optionButtons = [
            {icon: 'sync-alt', name: 'Refresh directory', callback: () => null},
            {icon: 'folder-minus', name: 'Clear file cache', callback: () => null},
        ];
    }

    static getDerivedStateFromProps(props, state) {
        if (props.path !== state.path) {
            return {
                path: props.path,
                levelUpDisabled: props.path === '/',
            };
        }
        return null;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.path !== this.props.path) {
            const normPath = path.normalize(this.props.path);
            this.setState({breadcrumbs: this.pathToBreadcrumbs(normPath)});
        }
    }

    componentDidMount() {
        this.changePath(this.props.path, true);
    }

    changePath = (newPath, tryUrlHash = false) => {
        const {location, history, tabPath} = this.props;

        if (tryUrlHash) {
            const uriHash = decodeURI(location.hash.slice(1));
            if (uriHash) newPath = uriHash;
        }
        const normPath = path.normalize(newPath);
        window.dataManager.dispatch(ReduxActions.TagTabChangePath, this.summary.id, normPath);
        const hash = `#${normPath}`;
        history.push(hash);
        window.dataManager.setEnvRoutePath({id: this.summary.id, path: `${tabPath}${hash}`});
    };

    pathToBreadcrumbs(normPath) {
        const pathParts = normPath === '/' ? [] : normPath.split('/').slice(1);
        const onClick = this.changePath;
        const breadcrumbs = new Array(pathParts.length + 1);
        breadcrumbs[0] = {id: '/', title: this.props.rootDirName, onClick};

        let currPath = '';
        for (let i = 0; i < pathParts.length; ++i) {
            const part = pathParts[i];
            currPath += `/${part}`;
            breadcrumbs[i + 1] = {id: currPath, title: part, onClick};
        }
        return breadcrumbs;
    }

    handleCheckboxChange = (id, value) => {
        this.setState({
            optionState: {
                ...this.state.optionState,
                [id]: value,
            },
        });
    };

    handleSelectionChange = selection => {
        this.setState({selection});
    };

    // noinspection JSUnusedLocalSymbols
    handleFileClick = (file, event, displayIndex) => {
        // Nothing to do here... YET.
    };

    handleFileDoubleClick = file => {
        const relPath = path.join(this.state.path, file.base);
        if (file.isDir) {
            this.changePath(relPath);
        } else if (window.dataManager.isLocalClient()) {
            return window.ipcModule.openFile({id: this.summary.id, path: relPath})
                .catch(window.handleError);
        } else {
            ModalUtil.showError({message: 'Opening files in the browser is not supported yet.'});
        }
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

    renderOptionCheckboxes() {
        const checkboxes = this.optionCheckboxes;
        const comps = new Array(checkboxes.length);
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = checkboxes[i];
            const key = `${this.summary.id}-${checkbox.id}`;
            comps[i] = <div key={key} className="dropdown-item">
                <div className="field">
                    <Checkbox id={checkbox.id} name={checkbox.name} checked={this.state.optionState[checkbox.id]}
                              onChange={this.handleCheckboxChange}/>
                </div>
            </div>;
        }
        return comps;
    }

    renderOptionButtons() {
        const buttons = this.optionButtons;
        const comps = new Array(buttons.length);
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const key = `${this.summary.id}-${button.name}`;
            comps[i] = <button key={key} className="dropdown-item" onClick={button.callback}>
                <Icon name={button.icon} wrapper={false}/>&nbsp;&nbsp;&nbsp;<span>{button.name}</span>
            </button>;
        }
        return comps;
    }

    render() {
        const state = this.state;
        const options = state.optionState;

        return <div>

            <div className="level env-tag-top-bar">
                <div className="level-left">
                    <div className="level-item">
                        <button className="button" disabled={state.levelUpDisabled}
                                onClick={() => this.changePath(path.join(state.path, '..'))}>
                            <Icon name="level-up-alt"/>
                        </button>
                    </div>
                    <div className="level-item breadcrumbs-level-item">
                        <Breadcrumbs options={state.breadcrumbs}/>
                    </div>
                </div>
                <div className="level-right">
                    <div className="level-item">
                        <div className="dropdown is-right is-hoverable">
                            <div className="dropdown-trigger">
                                <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                    <span>Options</span><Icon name="angle-down"/>
                                </button>
                            </div>
                            <div className="dropdown-menu" id="dropdown-menu" role="menu">
                                <div className="dropdown-content">
                                    {this.renderOptionCheckboxes()}
                                    <hr className="dropdown-divider"/>
                                    {this.renderOptionButtons()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FileExplorer summary={this.summary} options={options} contextMenuId={MenuIds.TagTab} path={state.path}
                          selectedFileHash={state.contextFileHash} onSelectionChange={this.handleSelectionChange}
                          onFileSingleClick={this.handleFileClick} onFileDoubleClick={this.handleFileDoubleClick}/>

            <ContextMenuWrapper id={MenuIds.TagTab} hideOnSelfClick={false} onShow={this.handleContextMenuShow}>
                <TagContextMenu id={MenuIds.TagTab} fileHash={state.contextFileHash} changePath={this.changePath}
                                summary={this.summary} selection={state.selection}
                                confirmDeletions={options[Options.ConfirmDeletions]}/>
            </ContextMenuWrapper>

            {/*<br/>*/}
            {/*<TagContextMenu id={TagContextMenuId} file={state.contextFile} changePath={this.changePath}*/}
            {/*                envSummary={state.summary} selection={state.selection}/>*/}

        </div>;
    }

}

export default connect((state, ownProps) => {
    const {summary} = ownProps;
    const tagTab = state.envMap[summary.id].tagTab;
    return {
        ...tagTab,
        rootDirName: upath.basename(summary.path),
    };
})(EnvTag);

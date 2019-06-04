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
import {ContextMenuWrapper, hideAllContextMenus, prepareContextMenuHandlers} from 'react-context-menu-wrapper';

import Icon from '../components/Icon';
import ModalUtil from '../../util/ModalUtil';
import Checkbox from '../components/Checkbox';
import FileEntry from '../components/FileEntry';
import Breadcrumbs from '../components/Breadcrumbs';
import TagContextMenu from '../components/TagContextMenu';
import {EnvironmentContext, KeyCode} from '../../typedef';

const Options = {
    CollapseLong: 'collapse-long',
    FoldersFirst: 'folders-first',
    ShowExtensions: 'show-exts',
    ShowHidden: 'show-hidden',
    ConfirmDeletions: 'confirm-deletions',
};

const TagContextMenuId = 'tag-context-menu';

class EnvTag extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        history: PropTypes.any,
        tabPath: PropTypes.string.isRequired,

        path: PropTypes.string.isRequired,
        rootDirName: PropTypes.string.isRequired,
        fileHashes: PropTypes.array.isRequired,
        fileMap: PropTypes.object.isRequired,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        this.state = {
            selection: {},
            contextFile: null,
            breadcrumbs: this.pathToBreadcrumbs(props.path),

            optionState: {
                [Options.CollapseLong]: false,
                [Options.FoldersFirst]: true,
                [Options.ShowExtensions]: true,
                [Options.ShowHidden]: true,
                [Options.ConfirmDeletions]: true,
            },
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
        let stateUpdate;
        if (props.path !== state.path) {
            stateUpdate = {
                path: props.path,
                selection: {},
                levelUpDisabled: props.path === '/',
            };
        } else {
            stateUpdate = {};
        }

        if (props.fileHashes !== state.fileHashes) stateUpdate.fileHashes = props.fileHashes;
        if (props.fileMap !== state.fileMap) stateUpdate.fileMap = props.fileMap;
        return stateUpdate;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.path !== this.props.path) {
            const normPath = path.normalize(this.props.path);
            this.setState({breadcrumbs: this.pathToBreadcrumbs(normPath)});
        }
    }

    componentDidMount() {
        this.changePath(this.props.path, true);
        document.addEventListener('keydown', this.handleKeyPress, false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress, false);
    }

    changePath = (newPath, tryUrlHash = false) => {
        if (tryUrlHash) {
            const uriHash = decodeURI(this.props.location.hash.slice(1));
            if (uriHash) newPath = uriHash;
        }
        const normPath = path.normalize(newPath);
        window.dataManager.changeTagTabPath({id: this.summary.id, path: normPath})
            .then(() => {
                const hash = `#${normPath}`;
                this.props.history.push(hash);
                window.dataManager.setEnvRoutePath({id: this.summary.id, path: `${this.props.tabPath}${hash}`});
            })
            .catch(window.handleError);
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

    handleKeyPress = event => {
        if (event.keyCode === KeyCode.Esc) {
            hideAllContextMenus();
        }
    };

    handleCheckboxChange = (id, value) => {
        this.setState({
            optionState: {
                ...this.state.optionState,
                [id]: value,
            },
        });
    };

    handleFileClick = (file, event) => {
        const hash = file.hash;

        const mod = event.ctrlKey || event.shiftKey;
        this.setState(prevState => {
            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            const selection = mod ? oldSel : {};
            if (oldSel[hash] && oldSelSize <= 1) {
                console.log(oldSelSize);
                delete selection[hash];
            } else {
                selection[hash] = file;
            }
            return {selection};
        });
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
            const newState = {contextFile: data};

            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            if (oldSelSize <= 1) {
                newState.selection = {};
                newState.selection[data.hash] = data;
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

    renderFiles() {
        const props = this.props;
        const state = this.state;
        const fileHashes = props.fileHashes;

        if (fileHashes.length === 0) {
            return <div className="file-nothing">
                No files to show.
            </div>;
        }

        let files = _.map(fileHashes, hash => props.fileMap[hash]);
        if (!state.optionState[Options.ShowHidden]) {
            files = _.filter(files, f => !f.name.startsWith('.'));
        }

        const compare = (fileA, fileB) => {
            if (state.optionState[Options.FoldersFirst]) {
                if (fileA.isDir && !fileB.isDir) return -1;
                if (!fileA.isDir && fileB.isDir) return 1;
            }

            return fileA.name.localeCompare(fileB.name);
        };
        files.sort(compare);

        const comps = new Array(files.length);
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            const handlers = prepareContextMenuHandlers({id: TagContextMenuId, data: file});
            comps[i] = <FileEntry key={file.hash} fileHash={file.hash} basePath={props.path} summary={this.summary}
                                  showExtension={state.optionState[Options.ShowExtensions]}
                                  collapseLongNames={state.optionState[Options.CollapseLong]}
                                  onSingleClick={this.handleFileClick} selected={!!state.selection[file.hash]}
                                  onDoubleClick={this.handleFileDoubleClick}
                                  handlers={handlers}/>;
        }

        return comps;
    }

    render() {
        const state = this.state;

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

            <div className="file-explorer">
                {this.renderFiles()}
            </div>

            <ContextMenuWrapper id={TagContextMenuId} hideOnSelfClick={false} onShow={this.handleContextMenuShow}>
                <TagContextMenu id={TagContextMenuId} file={state.contextFile} changePath={this.changePath}
                                summary={this.summary} selection={state.selection}
                                confirmDeletions={state.optionState[Options.ConfirmDeletions]}/>
            </ContextMenuWrapper>

            {/*<br/>*/}
            {/*<TagContextMenu id={TagContextMenuId} file={state.contextFile} changePath={this.changePath}*/}
            {/*                envSummary={state.summary} selection={state.selection}/>*/}

        </div>;
    }

}

export default connect((state, ownProps) => {
    const props = {
        ...state.envMap[ownProps.summary.id].tagTab,
    };
    props.rootDirName = upath.basename(ownProps.summary.path);
    return props;
})(EnvTag);

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import c from 'classnames';
import equal from 'fast-deep-equal';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';
import {NotificationManager} from 'react-notifications';

import Icon from './Icon';
import Util from '../../util/Util';
import FileEntry from './FileEntry';
import {
    EnvSummaryPropType,
    ExplorerOptions,
    ExplorerOptionsDefaults,
    KeyCode,
    ExplorerOptionsThatAffectSort,
} from '../../util/typedef';

const Options = ExplorerOptions;

const FileDataSource = {
    DirPath: 0,
    EntityIDs: 1,
};

const ExplorerPageSize = 200;

class FileExplorer extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        path: PropTypes.string,
        entityIds: PropTypes.arrayOf(PropTypes.string),
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        files: PropTypes.arrayOf(PropTypes.object),
        fileDataSource: PropTypes.number.isRequired,
        badHashes: PropTypes.arrayOf(PropTypes.string).isRequired,

        // Props passed by parent
        page: PropTypes.number,
        onPageChange: PropTypes.func,
        filter: PropTypes.string,
        onFilterChange: PropTypes.func,
        options: PropTypes.object,
        showStatusBar: PropTypes.bool,
        contextMenuId: PropTypes.string,
        onSelectionChange: PropTypes.func,
        onFileSingleClick: PropTypes.func,
        onFileDoubleClick: PropTypes.func,
        selectedFileHash: PropTypes.string,
    };

    static defaultProps = {
        page: 1,
        filter: '',
        options: ExplorerOptionsDefaults,
        showStatusBar: true,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;

        this.state = {
            page: 1,
            filter: props.filter,
            selection: {},
            lastSelectionIndex: -1,
        };
    }

    componentDidMount() {
        const props = this.props;
        const {path, fileDataSource, files, options, badHashes} = props;

        if (fileDataSource === FileDataSource.DirPath) {
            const wasCached = !!files;
            if (wasCached) this.setState({files: Util.sortFiles(files, options)});
            Promise.resolve()
                .then(() => window.dataManager.requestDirectoryContent({id: this.summary.id, path, wasCached}))
                .catch(window.handleError);
        } else {
            this.setState({files: files});
            if (badHashes.length !== 0) {
                Promise.resolve()
                    .then(() => window.dataManager.getEntityFiles({id: this.summary.id, hashes: badHashes}))
                    .catch(window.handleError);
            }
        }

        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    // noinspection JSCheckFunctionSignatures
    componentDidUpdate(prevProps) {
        const {path, files: propFiles, options, selectedFileHash, badHashes, fileDataSource, onSelectionChange, onPageChange} = this.props;
        const {files: stateFiles, selection} = this.state;
        if (fileDataSource === FileDataSource.DirPath && path !== prevProps.path) {
            const page = 1;
            const selection = {};
            this.setState({selection, page});
            if (onPageChange) onPageChange(page);
            if (onSelectionChange) onSelectionChange(selection);
            window.dataManager.requestDirectoryContent({id: this.summary.id, path, wasCached: !!propFiles})
                .catch(window.handleError);
        }

        if (selectedFileHash !== prevProps.selectedFileHash) {
            if (_.size(selection) <= 1) this.setState({selection: {[selectedFileHash]: true}});
        }
        if (propFiles) {

            let needToSort = propFiles !== prevProps.files;
            if (!needToSort) {
                for (const optionName of ExplorerOptionsThatAffectSort) {
                    if (options[optionName] !== prevProps.options[optionName]) {
                        needToSort = true;
                        break;
                    }
                }
            }
            if (needToSort) {
                this.setState({files: Util.sortFiles(propFiles, options)});
            }
        } else if (propFiles !== stateFiles) {
            this.setState({files: propFiles});
        }

        if (!equal(prevProps.badHashes, badHashes) && badHashes.length !== 0) {
            window.dataManager.getEntityFiles({id: this.summary.id, hashes: badHashes})
                .catch(window.handleError);
        }
    }

    handleKeydown = event => {
        const {onSelectionChange} = this.props;
        const {files, selection: oldSelection} = this.state;

        const tagName = event.target.tagName.toUpperCase();
        const isInInput = tagName === 'INPUT' || tagName === 'TEXTAREA';

        switch (event.keyCode) {
            case KeyCode.A:
                if (event.ctrlKey) {
                    if (!isInInput) {
                        event.preventDefault();
                        const selection = {};
                        if (_.size(oldSelection) !== files.length) {
                            for (const file of files) selection[file.hash] = true;
                        }
                        this.setState({selection});
                        if (onSelectionChange) onSelectionChange(selection);
                    }
                }
                break;
            default:
            // Do nothing
        }
    };

    handleSingleClick = (file, event, displayIndex) => {
        const {onSelectionChange, onFileSingleClick} = this.props;
        const {files} = this.state;

        const hash = file.hash;

        const ctrlKey = event.ctrlKey;
        const shiftKey = event.shiftKey;
        this.setState(prevState => {
            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);

            let selection = {};
            const rangeSelection = prevState.lastSelectionIndex !== -1 ? shiftKey : false;
            if (rangeSelection) {
                let a = prevState.lastSelectionIndex;
                let b = displayIndex;
                if (a > b) {
                    const temp = b;
                    b = a;
                    a = temp;
                }
                for (let i = a; i < b + 1; ++i) {
                    selection[files[i].hash] = true;
                }
            } else {
                if (ctrlKey) selection = oldSel;
                if (oldSel[hash] && oldSelSize <= 1) {
                    delete selection[hash];
                } else {
                    selection[hash] = !selection[hash];
                }
            }

            if (onSelectionChange) onSelectionChange(selection);

            const updateSelectionIndex = (prevState.lastSelectionIndex === -1) || !(ctrlKey || shiftKey);
            let newSelectionIndex = updateSelectionIndex ? displayIndex : prevState.lastSelectionIndex;
            return {selection, lastSelectionIndex: newSelectionIndex};
        });

        if (onFileSingleClick) onFileSingleClick(file, event, displayIndex);
    };

    handleDoubleClick = file => {
        const {onFileDoubleClick} = this.props;

        if (!file.isDir) {
            if (window.dataManager.isLocalClient()) {
                return window.ipcModule.openFile({id: this.summary.id, path: file.nixPath})
                    .catch(window.handleError);
            } else {
                NotificationManager.warning('Opening files in the browser is not supported yet.');
            }
        }
        if (onFileDoubleClick) onFileDoubleClick(file);
    };

    handleFilterChange = filter => {
        const {onFilterChange} = this.props;
        this.setState({filter});
        if (onFilterChange) onFilterChange(filter);
    };

    handlePageChange = page => {
        const {files} = this.state;
        const {onPageChange} = this.props;

        const pageCount = Math.ceil(files.length / ExplorerPageSize);
        page = _.clamp(page, 1, pageCount);
        this.setState({page});
        if (onPageChange) onPageChange(page);
    };

    renderPagination() {
        const {files, page} = this.state;
        if (!files) return;
        if (files.length < ExplorerPageSize) return;

        const pageCount = Math.ceil(files.length / ExplorerPageSize);
        const buttons = new Array(pageCount);
        for (let i = 0; i < pageCount; i++) {
            const pageNo = i + 1;
            const active = page === pageNo;
            buttons[i] = <li key={`pagination-button-${i}`}>
                <button className={`pagination-link ${active ? 'is-current' : ''}`}
                        onClick={() => active ? null : this.handlePageChange(pageNo)}>{pageNo}</button>
            </li>;
        }

        const prevPageDisabled = page <= 1;
        const nextPageDisabled = page >= pageCount;

        return <React.Fragment>
            <div className="level-item pagination-file-count">
                Showing files {(page - 1) * ExplorerPageSize + 1} - {Math.min(page * ExplorerPageSize, files.length)}
            </div>
            <div className="level-item">
                <nav className="pagination" role="navigation" aria-label="pagination">
                    <button className="pagination-previous" disabled={prevPageDisabled}
                            onClick={() => this.handlePageChange(page - 1)}>
                        <Icon name="arrow-left" wrapper={false}/>
                    </button>
                    <button className="pagination-next" disabled={nextPageDisabled}
                            onClick={() => this.handlePageChange(page + 1)}>
                        <Icon name="arrow-right" wrapper={false}/>
                    </button>
                    <ul className="pagination-list">{buttons}</ul>
                </nav>
            </div>
        </React.Fragment>;
    }

    renderStatusBar() {
        const {fileDataSource, badHashes} = this.props;
        const {files, selection, filter} = this.state;
        const fileCount = !files ? null : files.length;
        const selectionCount = _.size(selection);

        const targetWord = fileDataSource === FileDataSource.DirPath ? 'directory' : 'file list';

        let fileCountString = null;
        if (!_.isNil(fileCount)) {
            fileCountString = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
            if (badHashes.length > 0) fileCountString += ` (loading ${badHashes.length} more)`;
        }

        return <div className="file-explorer-bar">
            <nav className="level">
                <div className="level-left">
                    <div className="level-item">
                        <div className="field has-addons">
                            <div className="control has-icons-left has-icons-right">
                                <input className="input" type="text" placeholder={`Search in ${targetWord}`}
                                       disabled={true}
                                       value={filter} onChange={event => this.handleFilterChange(event.target.value)}/>
                                <span className="icon is-left"><Icon name="search" wrapper={false}/></span>
                            </div>
                        </div>
                    </div>
                    {!!fileCountString && <div className="level-item file-count">{fileCountString}</div>}
                    {selectionCount > 0 &&
                    <div className="level-item selection-count">{selectionCount} selected</div>}
                </div>

                <div className="level-right">
                    {this.renderPagination()}
                </div>
            </nav>
        </div>;
    }

    renderFiles() {
        const {options, badHashes, contextMenuId} = this.props;
        const {files, selection} = this.state;
        let {page} = this.state;
        const empty = files && files.length === 0;
        const loading = !files || (empty && badHashes.length > 0);

        if (loading) return <div className="file-explorer-text"><Icon name="cog" animation={true}/> Loading...</div>;
        else if (empty) return <div className="file-explorer-text">No files to show.</div>;

        let startIndex = 0;
        let endIndex = ExplorerPageSize;
        if (files.length > ExplorerPageSize) {
            const pageCount = Math.ceil(files.length / ExplorerPageSize);
            page = _.clamp(page, 1, pageCount);
            startIndex = (page - 1) * ExplorerPageSize;
            endIndex = page * ExplorerPageSize;
        }

        const comps = new Array(files.length);
        for (let i = startIndex; i < Math.min(endIndex, files.length); ++i) {
            const file = files[i];
            if (!file) {
                comps[i] =
                    <div key={`bad-${i}`} className="file-entry-bad"><Icon name="radiation"/> Bad file entry</div>;
            } else comps[i] = <FileEntry key={file.hash} hash={file.hash} summary={this.summary} options={options}
                                         showExtension={options[Options.ShowExtensions]} displayIndex={i}
                                         collapseLongNames={options[Options.CollapseLongNames]}
                                         selected={!!selection[file.hash]} contextMenuId={contextMenuId}
                                         onSingleClick={this.handleSingleClick}
                                         onDoubleClick={this.handleDoubleClick}/>;
        }
        return comps;
    }

    render() {
        const {showStatusBar} = this.props;
        const {files} = this.state;
        const loading = !files;
        const empty = files && files.length === 0;

        const listClassName = c({
            'file-explorer-list': true,
            'file-explorer-list-loading': loading,
            'file-explorer-list-empty': empty,
        });
        return <div className="file-explorer">
            {showStatusBar && this.renderStatusBar()}
            <div className={listClassName}>
                {this.renderFiles()}
            </div>
        </div>;
    };

}

export default connect((state, ownProps) => {
    const {summary, path, entityIds} = ownProps;
    const {fileMap, entityMap} = state.envMap[summary.id];
    if (!summary) throw new Error('FileExplorer needs "summary" in props!');
    if (!path && !entityIds) throw new Error('FileExplorer needs "path" or "entityIds" in props!');

    let fileDataSource;
    let fileHashes = null;
    if (path) {
        fileDataSource = FileDataSource.DirPath;
        const hash = Util.getFileHash(path);
        const directory = fileMap[hash];
        fileHashes = directory ? directory.fileHashes : null;
    } else if (entityIds) {
        fileDataSource = FileDataSource.EntityIDs;
        const entities = entityIds.map(id => entityMap[id]);
        fileHashes = entities.filter(e => !!e).map(e => e.hash).filter(h => !!h);
        if (fileHashes.length !== entities.length) {
            console.warn('Some entities in FileExplorer are missing relevant file hashes!');
        }
    }

    let files = null;
    let badHashes = [];
    if (fileHashes) {
        files = fileHashes.map(h => fileMap[h]);
        const badIndices = _.keys(_.pickBy(files, f => !f));
        _.pullAt(files, badIndices);
        badHashes = _.at(fileHashes, badIndices);
    }
    return {files, fileDataSource, badHashes};
})(FileExplorer);

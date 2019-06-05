/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

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

class FileExplorer extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        path: PropTypes.string.isRequired,
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        files: PropTypes.arrayOf(PropTypes.object),
        handlerObjects: PropTypes.arrayOf(PropTypes.object),

        // Props passed by parent
        options: PropTypes.object,
        contextMenuId: PropTypes.string,
        onSelectionChange: PropTypes.func,
        onFileSingleClick: PropTypes.func,
        onFileDoubleClick: PropTypes.func,
        selectedFileHash: PropTypes.string,
    };

    static defaultProps = {
        options: ExplorerOptionsDefaults,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;

        this.state = {
            files: null,
            selection: {},
            lastSelectionIndex: -1,
        };
    }

    componentDidMount() {
        const props = this.props;
        const {path, files, options} = props;
        const wasCached = !!files;

        if (wasCached) this.setState({files: Util.sortFiles(files, options)});
        window.dataManager.requestDirectoryContent({id: this.summary.id, path, wasCached})
            .catch(window.handleError);

        document.addEventListener('keydown', this.handleKeydown, false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown, false);
    }

    componentDidUpdate(prevProps) {
        const {path, files: propFiles, options, selectedFileHash} = this.props;
        const {files: stateFiles, selection} = this.state;
        if (path !== prevProps.path) {
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
    }

    handleKeydown = event => {
        const {onSelectionChange} = this.props;
        const {files} = this.state;

        switch (event.keyCode) {
            case KeyCode.A:
                if (event.ctrlKey) {
                    event.preventDefault();
                    const selection = {};
                    for (const file of files) selection[file.hash] = true;
                    this.setState({selection});
                    if (onSelectionChange) onSelectionChange(selection);
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

        if (onFileDoubleClick) onFileDoubleClick(file);
    };

    renderFiles() {
        const {options, contextMenuId} = this.props;
        const {files, selection} = this.state;

        const comps = new Array(files.length);
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            comps[i] = <FileEntry key={file.hash} hash={file.hash} summary={this.summary}
                                  showExtension={options[Options.ShowExtensions]} displayIndex={i}
                                  collapseLongNames={options[Options.CollapseLong]} selected={!!selection[file.hash]}
                                  onSingleClick={this.handleSingleClick} onDoubleClick={this.handleDoubleClick}
                                  contextMenuId={contextMenuId}/>;
        }
        return comps;
    }

    render() {
        const {files} = this.state;
        const directoryLoaded = !!files;

        let content;
        let classModifier = '';
        if (directoryLoaded) {
            if (files.length > 0) {
                content = this.renderFiles();
            } else {
                content = <div className="file-explorer-text">No files to show.</div>;
                classModifier = 'file-explorer-empty';
            }
        } else {
            content = <div className="file-explorer-text"><Icon name="cog" animation={true}/> Loading...</div>;
            classModifier = 'file-explorer-loading';
        }

        const className = `file-explorer ${classModifier}`;
        return <div className={className}>
            {content}
        </div>;
    };

}

export default connect((state, ownProps) => {
    const {summary, path} = ownProps;
    if (!summary) throw new Error('FileExplorer needs "summary" in props!');
    if (!path) throw new Error('FileExplorer needs "path" or "hash" in props!');

    const hash = Util.getFileHash(path);
    const fileMap = state.envMap[summary.id].fileMap;
    const directory = fileMap[hash];
    const fileHashes = directory ? directory.fileHashes : null;
    let files = null;
    if (fileHashes) {
        files = _.map(fileHashes, h => fileMap[h]);
    }
    return {files};
})(FileExplorer);

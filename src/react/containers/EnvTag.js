/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal';

import Icon from '../components/Icon';
import ModalUtil from '../../util/ModalUtil';
import FileEntry from '../components/FileEntry';
import Breadcrumbs from '../components/Breadcrumbs';

export default class EnvTag extends React.Component {

    static propTypes = {
        envSummary: PropTypes.object.isRequired,
        history: PropTypes.any,
    };

    constructor(props) {
        super(props);

        const summary = this.props.envSummary;
        const initPath = this.props.location.hash.slice(1) || '/';
        this.state = {
            summary,
            rootDirName: path.basename(summary.path),

            files: [],
            path: initPath,
        };
        this.state.breadcrumbs = this.pathToBreadcrumbs(this.state.path);
    }

    changePath = newPath => {
        const normPath = path.normalize(newPath);
        const s = this.state.summary;
        window.ipcModule.getEnvDirectoryContents({id: s.id, path: normPath})
            .then(files => {
                this.setState(prevState => ({
                    ...prevState,
                    files,
                    path: normPath,
                    breadcrumbs: this.pathToBreadcrumbs(normPath),
                }));
                this.props.history.push(`#${normPath}`);
            })
            .catch(window.handleError);
    };

    componentDidMount() {
        this.changePath(this.state.path);
    }

    componentDidUpdate(prevProps) {
        const summary = this.props.envSummary;
        const summaryChanged = !equal(prevProps.envSummary, summary);
        if (summaryChanged) {
            this.setState(prevState => ({
                ...prevState,
                summary,
            }));
        }
    }

    pathToBreadcrumbs(normPath) {
        const pathParts = normPath === '/' ? [] : normPath.split('/').slice(1);
        const onClick = this.changePath;
        const breadcrumbs = new Array(pathParts.length + 1);
        breadcrumbs[0] = {id: '/', icon: 'folder-open', title: this.state.rootDirName, onClick};

        let currPath = '';
        for (let i = 0; i < pathParts.length; ++i) {
            const part = pathParts[i];
            currPath += `/${part}`;
            breadcrumbs[i + 1] = {id: currPath, title: part, onClick};
        }
        return breadcrumbs;
    }

    handleFileClick = file => {
        if (file.name === '..') this.changePath(path.join(this.state.path, file.base));
    };

    handleFileDoubleClick = file => {
        const s = this.props.envSummary;
        const relPath = path.join(this.state.path, file.base);
        if (file.isDirectory) {
            this.changePath(relPath);
        } else if (window.dataManager.isLocalClient()) {
            window.ipcModule.openEnvFile({id: s.id, path: relPath})
                .catch(window.handleError);
        } else {
            ModalUtil.showError({message: 'Opening files in the browser is not supported yet.'});
        }
    };

    renderFiles() {
        const files = this.state.files;
        const comps = new Array(files.length);
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            comps[i] = <FileEntry key={file.id} file={file}
                                  onSingleClick={this.handleFileClick}
                                  onDoubleClick={this.handleFileDoubleClick}/>;
        }

        return comps;
    }

    render() {
        return <div>

            <div className="level env-tag-top-bar">
                <div className="level-left">
                    <div className="level-item">
                        <Breadcrumbs options={this.state.breadcrumbs}/>
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
                                    <hr className="dropdown-divider"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="file-explorer">
                {this.renderFiles()}
            </div>

        </div>;
    }

}

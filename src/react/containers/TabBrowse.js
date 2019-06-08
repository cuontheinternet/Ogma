/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import path from 'path';
import upath from 'upath';
import React from 'react';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';

import Icon from '../components/Icon';
import Breadcrumbs from '../components/Breadcrumbs';
import NewFileExplorer from '../components/files/FileExplorer';
import {EnvironmentContext, MenuIds, ExplorerOptionsDefaults, ReduxActions} from '../../util/typedef';

class TabBrowse extends React.Component {

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

    // noinspection JSCheckFunctionSignatures
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
        window.dataManager.dispatch(ReduxActions.TabBrowseChangePath, this.summary.id, normPath);
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

    render() {
        const state = this.state;

        return <React.Fragment>
            <Helmet><title>Browse</title></Helmet>

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
                </div>
            </div>

            <NewFileExplorer summary={this.summary} path={state.path} changePath={this.changePath}
                             contextMenuId={MenuIds.TabBrowse}/>

        </React.Fragment>;
    }

}

export default connect((state, ownProps) => {
    const {summary} = ownProps;
    const {tabBrowse} = state.envMap[summary.id];
    return {
        ...tabBrowse,
        rootDirName: upath.basename(summary.path),
    };
})(TabBrowse);

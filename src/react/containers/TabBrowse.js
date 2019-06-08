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
import Checkbox from '../components/Checkbox';
import Breadcrumbs from '../components/Breadcrumbs';
import NewFileExplorer from '../components/files/FileExplorer';
import {EnvironmentContext, MenuIds, ExplorerOptions, ExplorerOptionsDefaults, ReduxActions} from '../../util/typedef';

const Options = ExplorerOptions;

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
        this.optionCheckboxes = [
            {id: Options.CollapseLongNames, name: 'Collapse long names'},
            {id: Options.CollapseLongTags, name: 'Collapse long tags'},
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

    handleCheckboxChange = (id, value) => {
        this.setState({
            optionState: {
                ...this.state.optionState,
                [id]: value,
            },
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

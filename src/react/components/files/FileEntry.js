/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';
import VisibilitySensor from 'react-visibility-sensor';
import {prepareContextMenuHandlers} from 'react-context-menu-wrapper';

import Icon from '../Icon';
import TagGroup from '../TagGroup';
import {FolderIconData, getIconData} from '../../../util/IconUtil';
import {
    FileView,
    ColorsLight,
    ColorsDark,
    ThumbnailState,
    EnvironmentContext,
    EnvSummaryPropType,
    FilePropType,
} from '../../../util/typedef';

class FileEntry extends React.PureComponent {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        // Props used in redux.connect
        hash: PropTypes.string.isRequired,
        summary: EnvSummaryPropType.isRequired,


        // Props provided by redux.connect
        file: FilePropType.isRequired,

        // Props passed by parent
        view: PropTypes.string,
        showExtension: PropTypes.bool,
        collapseLongNames: PropTypes.bool,
        singleAndDoubleClickExclusive: PropTypes.bool,
        selected: PropTypes.bool,
        onSingleClick: PropTypes.func,
        onDoubleClick: PropTypes.func,
        displayIndex: PropTypes.number,
        contextMenuId: PropTypes.string,
    };

    static defaultProps = {
        selected: false,
        view: FileView.MediumThumb,
        showExtension: true,
        collapseLongNames: false,
        singleAndDoubleClickExclusive: false,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        const file = props.file;
        this.state = {
            thumbBgImage: null,
            icon: file.isDir ? FolderIconData : getIconData(file),
        };

        if (props.contextMenuId) {
            this.handlers = prepareContextMenuHandlers({id: props.contextMenuId, data: props.hash});
        } else {
            this.handlers = {};
        }

        this.clickCount = 0;
        this.wasVisibleOnce = false;
        this.imageLoadPromise = null;
        this.triggerSingleClick = (event, displayIndex) => {
            this.clickCount = 0;
            if (props.onSingleClick) props.onSingleClick(props.file, event, displayIndex);
        };
        this.triggerDoubleClick = event => {
            this.clickCount = 0;
            if (props.onDoubleClick) this.props.onDoubleClick(props.file, event);
        };
    }

    componentDidMount() {
        const file = this.props.file;
        if (file.thumb === ThumbnailState.Ready) this.loadThumbnail();
    }

    componentWillUnmount() {
        if (this.imageLoadPromise) this.imageLoadPromise.cancel();
    }

    // noinspection JSCheckFunctionSignatures
    componentDidUpdate(prevProps) {
        const oldFile = prevProps.file;
        const newFile = this.props.file;
        if (oldFile.thumb !== newFile.thumb
            && newFile.thumb === ThumbnailState.Ready) {
            this.loadThumbnail();
        }
    }

    loadThumbnail = () => {
        const {file} = this.props;
        const url = `${window.serverHost}/static/env/${this.summary.slug}/thumbs/${file.hash}.jpg`;
        this.setState({thumbBgImage: `url('${url}')`});
    };

    handleVisibilityChange = isVisible => {
        const file = this.props.file;
        if (file.thumb === ThumbnailState.Impossible || file.thumb === ThumbnailState.Ready) return;

        if (!isVisible || this.wasVisibleOnce) return;
        this.wasVisibleOnce = true;

        const summary = this.summary;
        Promise.resolve()
            .then(() => window.dataManager.requestFileThumbnail({id: summary.id, path: file.nixPath}))
            .catch(window.handleErrorQuiet);
    };

    handleClick = event => {
        const props = this.props;
        if (event.ctrlKey || event.shiftKey) return this.triggerSingleClick(event, props.displayIndex);

        this.clickCount++;
        if (this.clickCount === 1) {
            if (props.singleAndDoubleClickExclusive) {
                this.singleClickTimer = setTimeout(() => this.triggerSingleClick(event, props.displayIndex), 300);
            } else {
                this.triggerSingleClick(event, props.displayIndex);
                this.clickCount = 1;
                setTimeout(() => this.clickCount = 0, 300);
            }
        } else if (this.clickCount === 2) {
            clearTimeout(this.singleClickTimer);
            this.triggerDoubleClick(event);
        }
    };

    renderIcon(color = true) {
        const icon = this.state.icon;
        const style = {
            color: color ? ColorsLight[icon.colorCode] : 'inherit',
        };
        return <Icon name={icon.name} wrapper={false} style={style}/>;
    }

    render() {
        const {selected, view, showExtension, collapseLongNames} = this.props;
        const file = this.props.file;

        // Prepare file name
        let name = file.name;
        if (collapseLongNames) {
            const length = name.length;
            const extLength = showExtension ? file.ext.length : 0;
            if (length + extLength > 65) {
                // TODO: Improve this code.
                const collapse = <span className="file-entry-name-collapse">&lt;...&gt;</span>;
                name = <span>
                    {name.slice(0, 30)}
                    {collapse}
                    {name.slice(length - 24 + extLength)}
                </span>;
            }
        }


        const thumbBgImage = this.state.thumbBgImage;
        const thumbStyle = {backgroundImage: thumbBgImage};

        const className = `file-entry ${view} ${selected ? 'selected' : ''}`;
        if (view === FileView.List) {
            const iconStyle = {color: ColorsDark[this.state.icon.colorCode]};
            return (
                <VisibilitySensor partialVisibility={true} offset={{top: -150, bottom: -150}}
                                  intervalDelay={500}
                                  onChange={this.handleVisibilityChange}>
                    <button {...this.handlers} className={className} onClick={this.handleClick}>

                        {<div className={`file-entry-thumbnail ${thumbBgImage ? 'loaded' : ''}`} style={thumbStyle}/>}

                        <div className="file-entry-name">
                            <span className="file-entry-name-icon" style={iconStyle}>{this.renderIcon(false)}</span>
                            {name}
                            {showExtension && <span className="file-entry-name-ext">{file.ext}</span>}

                            {file.entityId && <div className="file-entry-tags">
                                <TagGroup summary={this.summary} entityId={file.entityId}
                                          showEllipsis={collapseLongNames}/>
                            </div>}
                        </div>


                    </button>
                </VisibilitySensor>
            );
        }

        const wrapperStyle = {backgroundColor: ColorsDark[this.state.icon.colorCode]};
        return (
            <VisibilitySensor partialVisibility={true} offset={{top: -150, bottom: -150}}
                              intervalDelay={500}
                              onChange={this.handleVisibilityChange}>
                <button {...this.handlers} className={className} onClick={this.handleClick} style={wrapperStyle}>

                    {<div className={`file-entry-thumbnail ${thumbBgImage ? 'loaded' : ''}`} style={thumbStyle}/>}

                    {selected && <div className={`file-entry-selected`}/>}

                    {file.entityId && <div className="file-entry-tags">
                        <TagGroup summary={this.summary} entityId={file.entityId}
                                  showEllipsis={collapseLongNames}/>
                    </div>}

                    <div className="file-entry-icon">
                        <div className="file-entry-icon-content">{this.renderIcon(true)}</div>
                    </div>

                    <div className="file-entry-name">
                        <span className="file-entry-name-icon">{this.renderIcon(false)}</span>
                        {name}
                        {showExtension && <span className="file-entry-name-ext">{file.ext}</span>}
                    </div>

                </button>
            </VisibilitySensor>
        );
    };

}

export default connect((state, ownProps) => {
    const {summary, hash} = ownProps;
    const fileMap = state.envMap[summary.id].fileMap;
    const file = fileMap[hash];
    return {file};
})(FileEntry);

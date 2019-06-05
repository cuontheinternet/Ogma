/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import VisibilitySensor from 'react-visibility-sensor';

import Icon from './Icon';
import TagGroup from './TagGroup';
import Util from '../../util/Util';
import {FolderIconData, getIconData} from '../../util/IconUtil';
import {FileView, ColorsLight, ColorsDark, ThumbnailState, EnvironmentContext, FilePropType} from '../../util/typedef';

class FileEntry extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        file: FilePropType.isRequired,
        basePath: PropTypes.string.isRequired,
        view: PropTypes.oneOf(Object.values(FileView)),
        selection: PropTypes.object,
        showExtension: PropTypes.bool,
        collapseLongNames: PropTypes.bool,
        singleAndDoubleClickExclusive: PropTypes.bool,

        handlers: PropTypes.object,

        selected: PropTypes.bool,
        onSingleClick: PropTypes.func,
        onDoubleClick: PropTypes.func,
        displayIndex: PropTypes.number,
    };

    static defaultProps = {
        view: FileView.MediumThumb,
        selection: {},
        showExtension: true,
        collapseLongNames: false,
        singleAndDoubleClickExclusive: false,

        selected: false,
    };

    constructor(props, context) {
        super(props);
        this.summary = context;

        const file = props.file;
        this.state = {
            thumbBgImage: null,
            icon: file.isDir ? FolderIconData : getIconData(file),
        };

        this.clickCount = 0;
        this.wasVisibleOnce = false;
        this.imageLoadPromise = null;
        this.triggerSingleClick = (event, displayIndex) => {
            this.clickCount = 0;
            if (this.props.onSingleClick) this.props.onSingleClick(this.props.file, event, displayIndex);
        };
        this.triggerDoubleClick = event => {
            this.clickCount = 0;
            if (this.props.onDoubleClick) this.props.onDoubleClick(this.props.file, event);
        };
    }

    componentDidMount() {
        const file = this.props.file;
        if (file.thumb === ThumbnailState.Ready) this.loadThumbnail();
    }

    componentWillUnmount() {
        if (this.imageLoadPromise) this.imageLoadPromise.cancel();
    }

    componentDidUpdate(prevProps) {
        const oldFile = prevProps.file;
        const newFile = this.props.file;
        if (oldFile.thumb !== newFile.thumb && newFile.thumb === ThumbnailState.Ready) this.loadThumbnail();
    }

    loadThumbnail = () => {
        const file = this.props.file;
        const summary = this.summary;
        const url = `${window.serverHost}/static/env/${summary.slug}/thumbs/${file.hash}.jpg`;

        this.imageLoadPromise = Util.loadImage(url)
            .then(() => {
                this.imageLoadPromise = null;
                this.setState({thumbBgImage: `url('${url}')`});
            });
    };

    handleVisibilityChange = isVisible => {
        const file = this.props.file;
        if (file.thumb === ThumbnailState.Impossible) return;

        if (!isVisible || this.wasVisibleOnce) return;
        this.wasVisibleOnce = true;

        const summary = this.summary;
        Promise.resolve()
            .then(() => window.ipcModule.requestFileThumbnail({id: summary.id, path: file.nixPath}))
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
        const props = this.props;
        const file = this.props.file;

        // Prepare file name
        let name = file.name;
        if (props.collapseLongNames) {
            const length = name.length;
            const extLength = props.showExtension ? file.ext.length : 0;
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

        const wrapperStyle = {backgroundColor: ColorsDark[this.state.icon.colorCode]};

        const thumbBgImage = this.state.thumbBgImage;
        const thumbStyle = {backgroundImage: thumbBgImage};

        const className = `file-entry ${props.view} ${props.selected ? 'selected' : ''}`;
        return (
            <VisibilitySensor partialVisibility={true} offset={{top: -150, bottom: -150}}
                              intervalDelay={500}
                              onChange={this.handleVisibilityChange}>
                <div {...props.handlers} className={className} onClick={this.handleClick} style={wrapperStyle}>

                    {<div className={`file-entry-thumbnail ${thumbBgImage ? 'loaded' : ''}`} style={thumbStyle}/>}

                    {props.selected && <div className={`file-entry-selected`}/>}

                    <div className="file-entry-tags">
                        <TagGroup summary={this.summary} tagIds={file.tagIds}/>
                    </div>

                    <div className="file-entry-icon">
                        <div className="file-entry-icon-content">{this.renderIcon(true)}</div>
                    </div>

                    <div className="file-entry-name">
                        <span className="file-entry-name-icon">{this.renderIcon(false)}</span>
                        {name}
                        {props.showExtension && <span className="file-entry-name-ext">{file.ext}</span>}
                    </div>

                </div>
            </VisibilitySensor>
        );
    };

}

export default connect((state, ownProps) => {
    const {summary, fileHash: hash} = ownProps;
    const fileMap = state.envMap[summary.id].fileMap;
    const file = fileMap[hash];
    return {file};
})(FileEntry);

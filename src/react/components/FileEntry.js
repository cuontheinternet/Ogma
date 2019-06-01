/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import VisibilitySensor from 'react-visibility-sensor';

import Icon from './Icon';
import {FileView, ColorsLight, ColorsDark} from '../../typedef';
import {FolderIconData, getIconData} from '../../util/IconUtil';

export default class FileEntry extends React.Component {

    static propTypes = {
        file: PropTypes.object.isRequired,
        basePath: PropTypes.string.isRequired,
        envSummary: PropTypes.object.isRequired,
        view: PropTypes.oneOf(Object.values(FileView)),
        selection: PropTypes.object,
        showExtension: PropTypes.bool,
        collapseLongNames: PropTypes.bool,
        singleAndDoubleClickExclusive: PropTypes.bool,

        selected: PropTypes.bool,
        onSingleClick: PropTypes.func,
        onDoubleClick: PropTypes.func,
    };

    static defaultProps = {
        view: FileView.MediumThumb,
        selection: {},
        showExtension: true,
        collapseLongNames: false,
        singleAndDoubleClickExclusive: false,

        selected: false,
    };

    constructor(props) {
        super(props);

        const file = props.file;
        this.state = {
            file,
            thumbUrl: null,
            relPath: path.join(props.basePath, file.base),
            icon: file.isDirectory ? FolderIconData : getIconData(file),
        };

        this.clickCount = 0;
        this.thumbLoaded = false;
        this.triggerSingleClick = event => {
            this.clickCount = 0;
            if (this.props.onSingleClick) this.props.onSingleClick(this.props.file, event);
        };
        this.triggerDoubleClick = event => {
            this.clickCount = 0;
            if (this.props.onDoubleClick) this.props.onDoubleClick(this.props.file, event);
        };
    }

    handleVisibilityChange = isVisible => {

        // TODO: Implement some sort of extension check to make sure we don't request thumbnails of text files and such.

        if (!isVisible) return;
        else if (this.thumbLoaded) return;
        this.thumbLoaded = true;

        const f = this.state.file;
        if (f.isDirectory) return;

        const s = this.props.envSummary;
        Promise.resolve()
            .then(() => window.ipcModule.getEnvFileThumbnail({id: s.id, path: this.state.relPath}))
            .then(thumbName => {
                if (!thumbName) return;
                this.setState({
                    thumbUrl: `url('${window.serverHost}/static/env/${s.slug}/thumbs/${thumbName}')`,
                });
            })
            .catch(window.handleErrorQuiet);
    };

    handleClick = event => {
        if (event.ctrlKey || event.shiftKey) return this.triggerSingleClick(event);

        this.clickCount++;
        if (this.clickCount === 1) {
            if (this.props.singleAndDoubleClickExclusive) {
                this.singleClickTimer = setTimeout(() => this.triggerSingleClick(event), 300);
            } else {
                this.triggerSingleClick(event);
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
        const file = this.state.file;

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

        const thumbUrl = this.state.thumbUrl;
        const thumbStyle = {backgroundImage: thumbUrl};

        const className = `file-entry ${this.props.view} ${props.selected ? 'selected' : ''}`;
        return (
            <VisibilitySensor partialVisibility={true} offset={{top: -150, bottom: -150}}
                              intervalDelay={500}
                              onChange={this.handleVisibilityChange}>
                <div className={className} onClick={this.handleClick} style={wrapperStyle}>

                    {<div className={`file-entry-thumbnail ${thumbUrl ? '' : 'hidden'}`} style={thumbStyle}/>}

                    {props.selected && <div className={`file-entry-selected`}/>}

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
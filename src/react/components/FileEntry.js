/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';

import Icon from './Icon';
import {FileView, ColorsLight, ColorsDark} from '../../typedef';
import {FolderIconData, getIconData} from '../../util/IconUtil';

export default class FileEntry extends React.Component {

    static propTypes = {
        file: PropTypes.object.isRequired,
        view: PropTypes.oneOf(Object.values(FileView)),
        showExtension: PropTypes.bool,

        onSingleClick: PropTypes.func,
        onDoubleClick: PropTypes.func,
    };

    static defaultProps = {
        view: FileView.MediumThumb,
        showExtension: true,
    };

    constructor(props) {
        super(props);

        const file = this.props.file;
        this.state = {
            file,
            icon: file.isDirectory ? FolderIconData : getIconData(file),
        };

        this.clickCount = 0;
    }

    handleClick = () => {
        this.clickCount++;
        if (this.clickCount === 1) {
            this.singleClickTimer = setTimeout(() => {
                this.clickCount = 0;
                if (this.props.onSingleClick) this.props.onSingleClick(this.props.file);
            }, 300);
        } else if (this.clickCount === 2) {
            clearTimeout(this.singleClickTimer);
            this.clickCount = 0;
            if (this.props.onDoubleClick) this.props.onDoubleClick(this.props.file);
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
        const file = this.state.file;
        const name = <div className="file-entry-name">
            <span className="file-entry-name-icon">{this.renderIcon(false)}</span>
            {file.name}
            {this.props.showExtension && <span className="file-entry-name-ext">{file.ext}</span>}
        </div>;

        const style = {
            backgroundColor: ColorsDark[this.state.icon.colorCode],
        };
        const className = `file-entry ${this.props.view}`;
        return <div className={className} onClick={this.handleClick} style={style}>
            {!file.isDirectory && <div className="file-entry-thumbnail"
                                       style={{}}/>}
            <div className="file-entry-icon">
                <div className="file-entry-icon-content">{this.renderIcon(true)}</div>
            </div>
            {name}
        </div>;
    };

}
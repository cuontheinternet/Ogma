/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import c from 'classnames';
import * as PropTypes from 'prop-types';

import Icon from '../Icon';
import {FileView, SortOrder} from '../../../util/typedef';

const SortOrderOptions = [
    {id: SortOrder.NameAsc, icon: 'sort-alpha-down'},
    {id: SortOrder.NameDesc, icon: 'sort-alpha-up'},
];

const FileViewOptions = [
    {id: FileView.List, icon: 'list-ul'},
    {id: FileView.MediumThumb, icon: 'th'},
    {id: FileView.LargeThumb, icon: 'th-large'},
];

export default class FileStatusBar extends React.Component {

    static propTypes = {
        // Props passed by parent
        filter: PropTypes.string.isRequired,
        onFilerChange: PropTypes.func.isRequired,
        fileCount: PropTypes.number.isRequired,
        hiddenCount: PropTypes.number.isRequired,
        selectionSize: PropTypes.number.isRequired,
        loadingCount: PropTypes.number.isRequired,
        sort: PropTypes.string.isRequired,
        onSortChange: PropTypes.func.isRequired,
        view: PropTypes.string.isRequired,
        onViewChange: PropTypes.func.isRequired,
        showPreview: PropTypes.bool.isRequired,
        onPreviewToggle: PropTypes.func.isRequired,
    };

    static defaultProps = {
        filter: '',
    };

    constructor(props) {
        super(props);

        this.state = {
            filter: props.filter,
        };
        if (props.onFilerChange) this.debouncedOnFilterChange = _.debounce(props.onFilerChange, 200);
    }

    handlerFilterChange = filter => {
        this.setState({filter});
        if (this.debouncedOnFilterChange) this.debouncedOnFilterChange(filter);
    };

    render() {
        const {
            fileCount, hiddenCount, selectionSize, loadingCount,
            sort, onSortChange, view, onViewChange, showPreview, onPreviewToggle,
        } = this.props;
        const {filter} = this.state;

        const previewButtonClasses = c({
            'button': true,
            'is-info': showPreview,
            'is-outlined': showPreview,
        });

        const sortButtons = new Array(FileViewOptions.length);
        for (let i = 0; i < SortOrderOptions.length; ++i) {
            const option = SortOrderOptions[i];
            const active = option.id === sort;
            const props = {
                key: `bar-order-${option.id}`,
                onClick: () => onSortChange(option.id),
                className: c({'button': true, 'toggle-button': true, 'is-info': active, 'is-outlined': active}),
            };
            sortButtons[i] = <button {...props}><Icon name={option.icon}/></button>;
        }

        const viewButtons = new Array(FileViewOptions.length);
        for (let i = 0; i < FileViewOptions.length; ++i) {
            const option = FileViewOptions[i];
            const active = option.id === view;
            const props = {
                key: `bar-view-${option.id}`,
                onClick: () => onViewChange(option.id),
                className: c({'button': true, 'toggle-button': true, 'is-info': active, 'is-outlined': active}),
            };
            viewButtons[i] = <button {...props}><Icon name={option.icon}/></button>;
        }

        const bracketCounts = [];
        if (hiddenCount !== 0) bracketCounts.push(`${hiddenCount} hidden`);
        if (loadingCount !== 0) bracketCounts.push(`${loadingCount} loading`);

        return <div className="status-bar">
            <nav className="level">
                <div className="level-left">
                    <div className="level-item">
                        <div className="field has-addons">
                            <div className="control has-icons-left has-icons-right">
                                <input className="input" type="text" placeholder={`Search in files`} value={filter}
                                       onChange={event => this.handlerFilterChange(event.target.value)}/>
                                <span className="icon is-left"><Icon name="search" wrapper={false}/></span>
                            </div>
                        </div>
                    </div>

                    {fileCount !== -1 &&
                    <div className="level-item"><p>
                        {fileCount} file{fileCount !== 1 ? 's' : ''}
                        {bracketCounts.length !== 0 && 
                        <span className="loading-count"> ({bracketCounts.join(', ')})</span>}
                    </p></div>}

                    {selectionSize !== 0 &&
                    <div className="level-item selection-count"><p>{selectionSize} selected</p></div>}
                </div>

                <div className="level-right">
                    <div className="level-item">{sortButtons}</div>
                    <div className="level-item">{viewButtons}</div>
                    <div className="level-item">
                        <button className={previewButtonClasses} onClick={onPreviewToggle}><Icon name="info"/></button>
                    </div>
                </div>
            </nav>
        </div>;
    };

}
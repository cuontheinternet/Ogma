/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class Breadcrumbs extends React.Component {

    static propTypes = {
        options: PropTypes.arrayOf(PropTypes.shape({
            title: PropTypes.string.isRequired,
            onClick: PropTypes.func,
            isActive: PropTypes.func,
        })).isRequired,
        lastIsActive: PropTypes.bool,
    };

    static defaultProps = {
        options: [
            {title: 'Breadcrumb #1', onClick: () => console.log('Breadcrumb #1 clicked')},
            {title: 'Breadcrumb #2', onClick: () => console.log('Breadcrumb #2 clicked')},
        ],
        lastIsActive: true,
    };

    constructor(props) {
        super(props);

        this.state = {options: this.props.options};
    }


    renderBreadcrumbs() {
        const options = this.state.options;
        const comps = new Array(options.length);
        for (let i = 0; i < options.length; ++i) {
            const option = options[i];

            let className = '';
            if (option.isActive || (this.props.lastIsActive && i === options.length - 1)) {
                className = 'is-active';
            }

            comps[i] = <li key={option.title} className={className}>
                <button onClick={option.onClick}>{option.title}</button>
            </li>;
        }
        return comps;
    }

    render() {
        return <nav className="breadcrumb" aria-label="breadcrumbs">
            <ul>
                {this.renderBreadcrumbs()}
            </ul>
        </nav>;
    };

}
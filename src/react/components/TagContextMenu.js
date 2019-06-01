/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class TagContextMenu extends React.Component {

    static propTypes = {
        // string: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="box is-danger">TagContextMenu component</div>;
    };

}
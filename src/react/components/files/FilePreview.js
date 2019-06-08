/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import * as PropTypes from 'prop-types';

export default class FilePreview extends React.Component {

    static propTypes = {
        string: PropTypes.string,
    };

    render() {
        return <h1>FilePreview component</h1>;
    };

}
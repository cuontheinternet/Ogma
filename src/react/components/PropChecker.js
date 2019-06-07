/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {detailedDiff} from 'deep-object-diff';

/**
 * @param {React.Component} WrappedComponent
 * @param {function(props: string): string} [getId]
 */
export default function withPropChecker(WrappedComponent, getId = null) {
    return class PropsChecker extends React.Component {
        componentDidUpdate(prevProps) {
            let id = '[...]';
            if (getId) id = `[${getId(this.props)}]`;

            Object.keys(prevProps).filter(key => prevProps[key] !== this.props[key])
                .map(key => {
                    const diff = detailedDiff(prevProps[key], this.props[key]);
                    console.log(
                        id, 'Changed property:', key,
                        'updated:', diff.updated,
                        'added:', diff.added,
                        'deleted:', diff.deleted,
                    );
                });
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    };
}

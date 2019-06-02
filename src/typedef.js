/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import PropTypes from 'prop-types';

/**
 * @typedef {object} HelloResponse
 * @property {boolean} localClient
 */

export const IndexRoutePath = '/';

export const BulmaSizes = ['small', 'medium', 'large'];

export const EnvRoutePaths = {
    browse: '/browse',
    search: '/search',
    tag: '/tag',
    configure: '/configure',
};
export const DefaultEnvRoutePath = EnvRoutePaths.browse;

export const FileView = {
    List: 'list',
    SmallThumb: 'small-thumb',
    MediumThumb: 'medium-thumb',
    LargeThumb: 'large-thumb',
};

export const FilePropType = PropTypes.shape({
    hash: PropTypes.string,
    nixPath: PropTypes.string,
    base: PropTypes.string,
    ext: PropTypes.string,
    name: PropTypes.string,
    isDir: PropTypes.boolean,
    thumb: PropTypes.number,
});

export * from '../../shared/typedef';


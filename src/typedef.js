/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {object} HelloResponse
 * @property {boolean} localClient
 */

export const FrontendEvents = {
    NewAllTags: 'fe-new-all-tags',
};

/**
 * @typedef {object} ReduxAction
 * @property {string} type
 * @property {string} [envId]
 * @property {*} data
 */
export const ReduxActions = {
    UpdateSummaries: 'update-summaries',
    UpdateSummary: 'update-summary',
    SetAllTags: 'set-all-tags',
    AddNewTags: 'add-new-tags',
    TagFiles: 'tag-files',
    UntagFiles: 'untag-files',

    UpdateEnvSubRoute: 'update-sub-route',

    TagTabChangeData: 'tagtab-change-data',
    TagTabRemoveFiles: 'tagtab-remove-files',
};

export const IndexRoutePath = '/';

export const BulmaSizes = ['small', 'medium', 'large'];

export const EnvironmentContext = React.createContext(null);

export const EnvRoutePaths = {
    browse: '/browse',
    search: '/search',
    tag: '/tag',
    configure: '/configure',
};
export const DefaultEnvRoutePath = EnvRoutePaths.browse;

export const EnvSummaryPropType = PropTypes.shape({
    id: PropTypes.string,
    path: PropTypes.string,
    slug: PropTypes.string,
    name: PropTypes.string,
    icon: PropTypes.string,
    color: PropTypes.string,
});

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
    entityId: PropTypes.string,
    tagIds: PropTypes.arrayOf(PropTypes.string),
});

export const KeyCode = {
    Enter: 13,
    Esc: 27,
};

export * from '../../shared/typedef';


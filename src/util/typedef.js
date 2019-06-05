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

    SetAllEntities: 'set-all-entities',

    SetDirectoryContent: 'set-dir-contents',
    SetMultipleFileDetails: 'set-multi-file-details',
    RemoveMultipleFiles: 'remove-files',
    UpdateThumbState: 'update-thumb-state',

    UpdateEnvSubRoute: 'update-sub-route',

    TabBrowseChangePath: 'browse-change-path',
    TabSearchChangeTagSelection: 'search-change-selection',
    TabSearchChangeTagSearchCondition: 'search-change-tag-cond',
    TabSearchChangeTagFilter: 'search-change-tag-filter',
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

export const MenuIds = {
    TabBrowse: 'browse-menu',
    TabSearch: 'search',
};

export const FileView = {
    List: 'list',
    MediumThumb: 'medium-thumb',
    LargeThumb: 'large-thumb',
};

export const ExplorerOptions = {
    SortOrder: 'sort-order',
    FileView: 'file-view',
    CollapseLongNames: 'collapse-names',
    CollapseLongTags: 'collapse-tags',
    FoldersFirst: 'folders-first',
    ShowExtensions: 'show-exts',
    ShowHidden: 'show-hidden',
    ConfirmDeletions: 'confirm-deletions',
};

export const ExplorerOptionsThatAffectSort = [
    ExplorerOptions.SortOrder,
    ExplorerOptions.FoldersFirst,
    ExplorerOptions.ShowHidden,
];

export const ExplorerOptionsDefaults = {
    [ExplorerOptions.SortOrder]: 'name-asc',
    [ExplorerOptions.FileView]: FileView.MediumThumb,
    [ExplorerOptions.CollapseLongNames]: false,
    [ExplorerOptions.CollapseLongTags]: true,
    [ExplorerOptions.FoldersFirst]: true,
    [ExplorerOptions.ShowExtensions]: true,
    [ExplorerOptions.ShowHidden]: true,
    [ExplorerOptions.ConfirmDeletions]: true,
};

export const TagSearchCondition = {
    All: 1,
    Any: 2,
};
export const DefaultTagSearchCondition = TagSearchCondition.All;

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
    A: 65,
    Enter: 13,
    Esc: 27,
};

export * from '../../../shared/typedef';


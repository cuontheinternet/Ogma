/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

/**
 * @typedef {object} HelloResponse
 * @property {boolean} localClient
 */

export const IndexRoutePath = '/';

export const BulmaSizes = ['small', 'medium', 'large'];

export const FrontendEvents = {
    UpdateEnvSummaries: 'update-env-summaries',
    UpdateEnvSummary: 'update-env-summary',
};

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

export * from '../../shared/typedef';


/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

const _ = require('lodash');
const shortid = require('shortid');
const Promise = require('bluebird');
const {dialog} = require('electron');

const Util = require('./Util');
const Environment = require('./Environment');
const {BackendEvents} = require('../typedef');

const logger = Util.getLogger();

class EnvironmentManager {

    /**
     * @param {object} data
     * @param {EventEmitter} data.emitter
     * @param {Config} data.config
     */
    constructor(data) {
        this.emitter = data.emitter;
        this.config = data.config;
        this.openEnvs = [];

        this.idMap = {};
        this.slugMap = {};
        this.pathMap = {};
    }

    init() {
        const openEnvs = this.config.getOpenEnvironments();
        const openPromises = new Array(openEnvs.length);
        for (let i = 0; i < openEnvs.length; ++i) {
            const envPath = openEnvs[i];
            openPromises[i] = this.openEnvironment({
                path: envPath, preventOpenEnvUpdate: true, allowCreate: false,
            })
                .catch(error => {
                    logger.error(`Error occurred while opening environment. Path: ${envPath}`, error);
                });
        }

        return Promise.all(openPromises)
            .then(() => this._broadcastSummariesUpdate());
    }

    /**
     * @param {object} data
     * @param {string} [data.path] Absolute path to the new environment. If it's not provided, will prompt user to
     *                             choose path.
     */
    createEnvironment(data = {}) {
        let envPath = data.path;
        if (!envPath) {
            envPath = dialog.showOpenDialog({
                title: 'Choose a root folder for the collection',
                properties: ['openDirectory', 'showHiddenFiles', 'createDirectory', 'noResolveAliases'],
            })[0];
        }

        if (!envPath) return Promise.resolve(null);

        return this.openEnvironment({path: envPath, allowCreate: true});
    }

    /**
     * @param {object} data
     * @param {string} data.path Absolute path to an environment
     * @param {boolean} [data.preventOpenEnvUpdate] Whether to update open environments in the config
     * @param {boolean} [data.allowCreate]
     */
    openEnvironment(data) {
        if (this.pathMap[data.path]) throw new Error(`Environment is already open! Path: ${data.path}`);

        let env;
        return Promise.resolve()
            .then(() => {
                env = new Environment({path: data.path, envManager: this, allowCreate: data.allowCreate});
                return env.init();
            })
            .then(() => {
                const s = env.getSummary();
                if (this.idMap[s.id]) throw new Error(`Opened environment has duplicate ID: ${s.id}`);
                if (this.slugMap[s.slug]) throw new Error(`Opened environment has duplicate slug: ${s.slug}`);
                this.idMap[s.id] = env;
                this.slugMap[s.slug] = env;
                this.pathMap[s.path] = env;

                this.openEnvs.push(env);
                if (!data.preventOpenEnvUpdate) this._broadcastSummariesUpdate();

                return s;
            });
    }

    _broadcastSummariesUpdate() {
        const envSummaries = this.getSummaries();
        this.emitter.emit(BackendEvents.UpdateEnvSummaries, envSummaries);
    }

    getSummaries() {
        const envs = Object.values(this.idMap);
        const summaries = new Array(envs.length);
        for (let i = 0; i < envs.length; ++i) {
            summaries[i] = envs[i].getSummary();
        }
        return summaries;
    }

    getNewId() {
        let id = shortid.generate();
        while (this.idMap[id]) {
            id = shortid.generate();
        }
        return id;
    }

    /**
     * @param {string} baseName
     */
    getNewSlug(baseName) {
        let base_slug = baseName.trim().toLowerCase();
        base_slug = base_slug.replace(/[^a-z0-9\-]/g, '-');
        base_slug = base_slug.replace(/-+/g, '-');

        let slug = base_slug;
        let count = 1;
        while (this.slugMap[slug]) {
            slug = `${base_slug}-${count}`;
            ++count;
        }

        return slug;
    }

}

module.exports = EnvironmentManager;
/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

const path = require('path');
const upath = require('upath');
const crypto = require('crypto');
const shortid = require('shortid');
const isDev = require('electron-is-dev');

const Logger = require('./Logger');

const packageRoot = path.normalize(path.join(__dirname, '..', '..'));
const packageInfo = require('../../package');
const staticPath = path.normalize(path.join(packageRoot, 'ogma-frontend', 'build'));

const developmentMode = isDev && process.env.NODE_ENV !== 'production';

class Util {

    static getPackageVersion() {
        return packageInfo.version;
    }

    static getLogger() {
        return Logger;
    }

    static getStaticPath() {
        return staticPath;
    }

    static getShortId() {
        return shortid.generate();
    }

    /**
     * @param {string} string
     * @returns {string}
     */
    static getMd5(string) {
        return crypto.createHash('md5').update(string).digest('hex');
    }

    /**
     * @param {string} nixPath
     * @returns {string}
     */
    static getFileHash(nixPath) {
        return Util.getMd5(nixPath).substring(0, 12);
    }

    /**
     * @returns {string}
     */
    static getTagId() {
        return Util.getShortId();
    }

    static getEnvPath(relPath) {
        return path.normalize(path.join(path.sep, relPath));
    }

    static getEnvNixPath(relPath) {
        return upath.normalize(upath.join(upath.sep, relPath));
    }

    static isDevelopment() {
        return developmentMode;
    }

    /**
     * @param {Database} db
     * @param {string} statement
     * @param {boolean} pluck
     */
    static prepSqlGet(db, statement, pluck = false) {
        const stmt = db.prepare(statement);
        if (pluck) stmt.pluck();
        return stmt.get.bind(stmt);
    }

    /**
     * @param {Database} db
     * @param {string} statement
     * @param {boolean} pluck
     */
    static prepSqlAll(db, statement, pluck = false) {
        const stmt = db.prepare(statement);
        if (pluck) stmt.pluck();
        return stmt.all.bind(stmt);
    }

    /**
     * @param {Database} db
     * @param {string} statement
     */
    static prepSqlRun(db, statement) {
        const stmt = db.prepare(statement);
        return stmt.run.bind(stmt);
    }

}

module.exports = Util;

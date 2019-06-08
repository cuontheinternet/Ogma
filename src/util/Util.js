/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import md5 from 'md5';
import _ from 'lodash';
import Promise from 'bluebird';

import {ExplorerOptions, SortOrder} from './typedef';

export default class Util {

    static deepClone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    static loadImage(url) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.addEventListener('load', e => resolve(img));
            img.addEventListener('error', () => {
                reject(new Error(`Failed to load image from URL: ${url}`));
            });
            img.src = url;
        });
    }

    static loadScript(url) {
        return new Promise((resolve, reject) => {
            try {
                const script = document.createElement('script');
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Could not download script from "${url}".`));
                script.src = url;
                document.head.appendChild(script);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {string} string
     * @param {number} length
     * @param {string} ellipsis
     * @returns {string}
     */
    static truncate(string, length, ellipsis = '...') {
        if (string.length < length + 5) return string;
        else return `${string.substring(0, length)}${ellipsis}`;
    }

    /**
     * @param {string} string
     * @returns {string}
     */
    static getMd5(string) {
        return md5(string);
    }

    /**
     * @param {string} nixPath
     * @returns {string}
     */
    static getFileHash(nixPath) {
        return Util.getMd5(nixPath).substring(0, 12);
    }

    /**
     * @param {any[]} array
     * @param {function(any): string} keyFunc
     */
    static arrayToObject(array, keyFunc) {
        const obj = {};
        for (const elem of array) {
            obj[keyFunc(elem)] = elem;
        }
        return obj;
    }

    static sortFiles(unsortedFiles, options) {
        let files = unsortedFiles;
        if (!options[ExplorerOptions.ShowHidden]) {
            files = _.filter(files, f => !f.name.startsWith('.'));
        }
        const compare = (fileA, fileB) => {
            if (options[ExplorerOptions.FoldersFirst]) {
                if (fileA.isDir && !fileB.isDir) return -1;
                if (!fileA.isDir && fileB.isDir) return 1;
            }

            if (options[ExplorerOptions.SortOrder] === SortOrder.NameAsc) {
                return fileA.base.localeCompare(fileB.base);
            } else {
                return fileA.base.localeCompare(fileB.base) * -1;
            }
        };
        files.sort(compare);
        return files;
    };

}

/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

const Promise = require('bluebird');

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

    static objectLength(object, keyCheck = null, valueCheck = null) {
        const keys = Object.keys(object);
        let length = 0;
        for (const key of keys) {
            if (keyCheck && !keyCheck(key)) continue;
            if (valueCheck && !valueCheck(object[key])) continue;
            ++length;
        }
        return length;
    }

}

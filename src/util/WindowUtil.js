/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

const Promise = require('bluebird');

export default class WindowUtil {

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

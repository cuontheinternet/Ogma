/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import TrieSearch from 'trie-search';

import {ColorsLight} from '../typedef';

export const FolderIconData = {name: 'folder', colorCode: 0};
const FileIconData = {name: 'file', colorCode: 0};
const IconsToExtensions = {
    'cube': ['3ds', 'obj', 'ply'],
    'database': ['json', 'sql'],
    'file-archive': ['zip', 'rar', 'tar', 'tar.gz'],
    'file-image': ['png', 'jpg', 'jpeg', 'svg', 'tiff'],
    'file-pdf': ['pdf'],
    'film': ['avi', 'mp4', 'mkv', 'flv'],
    'file-code': ['js', 'html', 'php'],
    'terminal': ['run', 'sh'],

    'b:ubuntu': ['deb'],
};

const step = 7;
let colourIndex = 0;

const ts = new TrieSearch();
for (const name in IconsToExtensions) {
    const exts = IconsToExtensions[name];
    for (let i = 0; i < exts.length; ++i) {
        colourIndex += step;
        const colorCode = colourIndex % (ColorsLight.length - 1) + 1;
        ts.map(exts[i], {name, colorCode});
    }
}

export const getIconData = file => {
    const ext = file.ext.replace(/^\./, '');
    const match = ts.get(ext);
    return match.length === 0 ? FileIconData : match[0];
};

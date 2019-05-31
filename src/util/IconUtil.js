/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {ColorsLight} from '../typedef';
import ExactTrie from '../../../shared/ExactTrie';

export const FolderIconData = {name: 'folder', colorCode: 0};
const FileIconData = {name: 'file', colorCode: 0};
const IconsToExtensions = {
    'cube': ['3ds', 'obj', 'ply'],
    'database': ['json', 'sql'],
    'file-archive': ['zip', 'rar', 'tar', 'tar.gz'],
    'file-image': ['png', 'jpg', 'jpeg', 'svg', 'tiff'],
    'file-pdf': ['pdf'],
    'film': ['avi', 'mp4', 'mkv', 'flv', 'webm'],
    'file-code': ['js', 'html', 'php'],
    'terminal': ['run', 'sh'],

    'b:ubuntu': ['deb'],
    'b:linux': ['AppImage'],
};

const step = 7;
let colourIndex = 0;

const exactTrie = new ExactTrie();
for (const name in IconsToExtensions) {
    const exts = IconsToExtensions[name];
    for (let i = 0; i < exts.length; ++i) {
        colourIndex += step;
        const colorCode = colourIndex % (ColorsLight.length - 1) + 1;
        exactTrie.put(exts[i], {name, colorCode}, true);
    }
}

export const getIconData = file => {
    const match = exactTrie.getWithCheckpoints(file.base, '.', true);
    return match ? match : FileIconData;
};

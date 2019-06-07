/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import equal from 'fast-deep-equal';
import {createSelectorCreator, defaultMemoize} from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
    defaultMemoize,
    equal,
);

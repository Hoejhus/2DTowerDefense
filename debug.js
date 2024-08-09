"use strict";

import { clearDebugInfo } from './view.js';

let debugMode = false;

export function toggleDebugMode() {
    debugMode = !debugMode;
    console.log(`Debug mode: ${debugMode}`);

    if (!debugMode) {
        clearDebugInfo();
    }
}

export function isDebugMode() {
    return debugMode;
}

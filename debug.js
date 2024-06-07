"use strict";

let debugMode = false;

export function toggleDebugMode() {
    debugMode = !debugMode;
    console.log(`Debug mode: ${debugMode}`);
}

export function isDebugMode() {
    return debugMode;
}

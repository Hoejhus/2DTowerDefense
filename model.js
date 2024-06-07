"use strict";

import { displayDebugInfo } from './view.js';
import { PriorityQueue } from './priorityQueue.js';
import { isDebugMode } from './debug.js';

export let lastTimeStamp = 0;
export let deltaTime = 0;

export const towers = [];
export const enemies = [];
export const enemyQueue = new PriorityQueue();

export const backgroundTiles = [
    [0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 2, 2, 0],
    [0, 0, 0, 2, 3, 3, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 3, 2, 0, 0],
    [0, 2, 0, 0, 0, 3, 2, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 3, 2, 2, 0, 3, 2, 2, 0, 0, 0, 0, 1, 2, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 0, 0, 0],
    [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 3, 0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0],
    [0, 0, 3, 1, 0, 0, 0, 0, 0, 2, 3, 0, 2, 2, 3, 0],
    [0, 2, 1, 1, 1, 0, 3, 0, 0, 0, 3, 0, 0, 3, 0, 0],
    [0, 0, 1, 1, 0, 3, 3, 2, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 3, 0],
    [0, 0, 0, 0, 2, 0, 3, 0, 0, 0, 0, 3, 1, 1, 0, 0],
    [0, 0, 3, 3, 0, 2, 0, 0, 0, 2, 2, 0, 3, 0, 0, 0],
    [0, 0, 0, 0, 3, 0, 0, 3, 3, 0, 0, 0, 0, 2, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 7, 3, 0, 0, 0, 0, 3, 0]
];

export const GRID_WIDTH = backgroundTiles[0].length;
export const GRID_HEIGHT = backgroundTiles.length;
export const TILE_SIZE = 32;

export const player = {
    row: 7,
    col: 7
};

export const goal = {
    row: GRID_HEIGHT - 1,
    col: Math.floor(GRID_WIDTH / 2)
};

export function resetGame() {
    player.row = 7;
    player.col = 7;

    enemies.length = 0;
    towers.length = 0;
    enemyQueue.clear();
}

export function checkGoalReached(enemy) {
    const enemyRow = Math.floor(enemy.y / TILE_SIZE);
    const enemyCol = Math.floor(enemy.x / TILE_SIZE);
    if (enemyRow === goal.row && enemyCol === goal.col) {
        console.log("Goal reached! Restarting game...");
        resetGame();
        return true;
    }
    return false;
}

export class Node {
    constructor(row, col, g, h, parent = null) {
        this.row = row;
        this.col = col;
        this.g = g; // Cost from start to this node
        this.h = h; // Estimated cost from this node to the goal
        this.f = g + h; // Total cost
        this.parent = parent; // Parent node in the path
    }
}

export function heuristic(row1, col1, row2, col2) {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
}

function getNeighbors(node) {
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];
    return directions
        .map(dir => new Node(node.row + dir.row, node.col + dir.col, 0, 0))
        .filter(newNode => newNode.row >= 0 && newNode.row < GRID_HEIGHT && newNode.col >= 0 && newNode.col < GRID_WIDTH);
}

export function aStar(start, goal) {
    const openList = [];
    const closedList = new Set();
    const startNode = new Node(start.row, start.col, 0, heuristic(start.row, start.col, goal.row, goal.col));
    openList.push(startNode);

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f); // Sort nodes by total cost
        const currentNode = openList.shift(); // Get node with lowest cost

        if (currentNode.row === goal.row && currentNode.col === goal.col) {
            const path = [];
            let node = currentNode;
            while (node) {
                path.push({ row: node.row, col: node.col });
                node = node.parent;
            }

            if (isDebugMode()) {
                displayDebugInfo({ path: path.reverse() });
            }

            return path.reverse();
        }

        closedList.add(`${currentNode.row},${currentNode.col}`);

        for (const neighbor of getNeighbors(currentNode)) {
            if (closedList.has(`${neighbor.row},${neighbor.col}`)) {
                continue; 
            }

            const tileType = backgroundTiles[neighbor.row][neighbor.col];
            if ([1, 2, 4, 5, 6].includes(tileType)) {
                continue;
            }

            const g = currentNode.g + 1;
            const h = heuristic(neighbor.row, neighbor.col, goal.row, goal.col);
            const existingNode = openList.find(node => node.row === neighbor.row && node.col === neighbor.col);

            if (existingNode && g < existingNode.g) {
                existingNode.g = g;
                existingNode.f = g + h;
                existingNode.parent = currentNode;
            } else if (!existingNode) {
                openList.push(new Node(neighbor.row, neighbor.col, g, h, currentNode));
            }
        }
    }

    return []; // No path found
}
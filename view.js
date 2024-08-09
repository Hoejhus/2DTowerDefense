"use strict";

import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, backgroundTiles, enemies, player } from './model.js';

export function createTiles() {
    const background = document.querySelector('#background');
    background.style.setProperty('--GRID_WIDTH', GRID_WIDTH);
    background.style.setProperty('--GRID_HEIGHT', GRID_HEIGHT);
    background.style.setProperty('--TILE_SIZE', TILE_SIZE + 'px');

    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const tile = document.createElement('div');
            tile.classList.add('tile', getClassForTile(backgroundTiles[row][col]));
            tile.id = `tile-${row}-${col}`;
            background.append(tile);
        }
    }
    console.log("Tiles created:", document.querySelectorAll('#background .tile').length);
}

export function displayTiles() {
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const tileElement = document.getElementById(`tile-${row}-${col}`);
            if (tileElement) {
                const tileClass = getClassForTile(backgroundTiles[row][col]);
                tileElement.className = 'tile';
                tileElement.classList.add(tileClass);
            } else {
                console.error(`Tile element not found: #tile-${row}-${col}`);
            }
        }
    }
}

export function displayPlayerAtPosition() {
    const visualPlayer = document.querySelector('#player');
    if (visualPlayer) {
        visualPlayer.style.width = `${TILE_SIZE}px`;
        visualPlayer.style.height = `${TILE_SIZE}px`;
        visualPlayer.style.transform = `translate(${player.col * TILE_SIZE}px, ${player.row * TILE_SIZE}px)`;
    } else {
        console.error("Player element not found");
    }
}

export function displayEnemiesAtPosition() {
    const enemyContainer = document.querySelector("#characters");
    enemies.forEach((enemy, index) => {
        let visualEnemy = document.querySelector(`#enemy-${index}`);
        if (!visualEnemy) {
            visualEnemy = document.createElement('div');
            visualEnemy.id = `enemy-${index}`;
            visualEnemy.classList.add('enemy', 'animate');
            const healthBar = createHealthBar(enemy);
            visualEnemy.appendChild(healthBar);
            enemyContainer.appendChild(visualEnemy);
        }

        visualEnemy.style.transform = `translate(${enemy.x - enemy.regX}px, ${enemy.y - enemy.regY}px)`;
        visualEnemy.style.width = `${TILE_SIZE}px`;
        visualEnemy.style.height = `${TILE_SIZE}px`;

        updateHealthBar(enemy, index);
    });
}

export function respawnEnemyDivs() {
    const enemyContainer = document.querySelector("#characters");

    // Remove all existing enemy divs
    enemyContainer.querySelectorAll('.enemy').forEach(enemyDiv => enemyDiv.remove());

    // Recreate enemy divs at their new positions
    enemies.forEach((enemy, index) => {
        const visualEnemy = document.createElement('div');
        visualEnemy.id = `enemy-${index}`;
        visualEnemy.classList.add('enemy', 'animate');
        const healthBar = createHealthBar(enemy);
        visualEnemy.appendChild(healthBar);
        enemyContainer.appendChild(visualEnemy);

        // Position the enemy div according to the enemy's coordinates
        visualEnemy.style.transform = `translate(${enemy.x - enemy.regX}px, ${enemy.y - enemy.regY}px)`;
        visualEnemy.style.width = `${TILE_SIZE}px`;
        visualEnemy.style.height = `${TILE_SIZE}px`;
    });
}

function createHealthBar(enemy) {
    const healthBar = document.createElement('div');
    healthBar.classList.add('health-bar');
    const healthBarInner = document.createElement('div');
    healthBarInner.classList.add('health-bar-inner');
    healthBar.appendChild(healthBarInner);
    return healthBar;
}

function updateHealthBar(enemy, index) {
    const visualEnemy = document.querySelector(`#enemy-${index}`);
    if (visualEnemy) {
        const healthBarInner = visualEnemy.querySelector('.health-bar-inner');
        if (healthBarInner) {
            healthBarInner.style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
        }
    }
}

export function addTileToBuildings(row, col, type) {
    const buildings = document.querySelector('#buildings');
    const tile = document.createElement('div');
    tile.classList.add('tile', type);
    tile.style.width = `${TILE_SIZE}px`;
    tile.style.height = `${TILE_SIZE}px`;
    tile.style.position = 'absolute';
    tile.style.transform = `translate(${col * TILE_SIZE}px, ${row * TILE_SIZE}px)`;

    const healthBar = document.createElement('div');
    healthBar.classList.add('health-bar');
    const healthBarInner = document.createElement('div');
    healthBarInner.classList.add('health-bar-inner');
    healthBar.appendChild(healthBarInner);
    tile.appendChild(healthBar);

    buildings.append(tile);
}

export function displayArrow(arrow) {
    const arrowElement = document.createElement('div');
    arrowElement.classList.add('arrow');
    arrowElement.style.transform = `translate(${arrow.x}px, ${arrow.y}px)`;
    document.querySelector('#characters').appendChild(arrowElement);

    const deltaX = arrow.targetX - arrow.x;
    const deltaY = arrow.targetY - arrow.y;
    const angle = Math.atan2(deltaY, deltaX) * (30 / Math.PI);
    arrowElement.style.transform = `translate(${arrow.x}px, ${arrow.y}px) rotate(${angle}deg)`;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = distance / arrow.speed;
    arrowElement.style.transition = `transform ${duration}s linear`;
    setTimeout(() => {
        arrowElement.style.transform = `translate(${arrow.targetX}px, ${arrow.targetY}px) rotate(${angle}deg)`;
    }, 10);

    setTimeout(() => {
        arrowElement.remove();
    }, duration * 1000);
}

function getClassForTile(tile) {
    const tileClasses = ['grass', 'water', 'tree', 'flower', 'fence_hori', 'fence_vert', 'pot', 'pot_smashed'];
    return tileClasses[tile] || '';
}

export function displayDebugInfo(enemy) {
    enemy.path.forEach((node, stepIndex) => {
        const tileElement = document.getElementById(`tile-${node.row}-${node.col}`);
        if (tileElement) {
            const stepElement = document.createElement('div');
            stepElement.classList.add('debug-step');
            stepElement.innerText = stepIndex;
            tileElement.appendChild(stepElement);
        }
    });
}

export function clearDebugInfo() {
    document.querySelectorAll('.debug-step').forEach(step => step.remove());
}

"use strict";

import { createTiles, displayTiles, displayPlayerAtPosition, displayEnemiesAtPosition, addTileToBuildings, displayArrow, clearDebugInfo, displayDebugInfo } from './view.js';
import { towers, enemies, enemyQueue, backgroundTiles, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, player, goal, heuristic, aStar, checkGoalReached } from './model.js';
import { toggleDebugMode, isDebugMode } from './debug.js';

window.addEventListener('load', start);
document.addEventListener('keydown', keyDown);

let deltaTime = 0;
let lastTimeStamp = 0;

function start() {
    console.log("Tower Defense Started");
    createTiles();
    displayTiles();
    startSpawningEnemies();
    startShooting();
    tick();
}

function tick(timestamp) {
    requestAnimationFrame(tick);
    deltaTime = (timestamp - lastTimeStamp) / 1000;
    lastTimeStamp = timestamp;

    if (isDebugMode()) {
        clearDebugInfo();
    }

    displayEnemiesAtPosition();
    displayPlayerAtPosition();
    moveEnemies();

    if (isDebugMode()) {
        enemies.forEach(enemy => displayDebugInfo(enemy));
    }
}

function keyDown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 't':
        case 'T':
            placeTower();
            break;
        case 'f':
        case 'F':
            placeFenceHori();
            break;
        case 'd':
        case 'D':
            toggleDebugMode();
            break;
    }
    console.log("Player: ", player);
}

function movePlayer(deltaX, deltaY) {
    const newRow = player.row + deltaY;
    const newCol = player.col + deltaX;

    if (newRow >= 0 && newRow < GRID_HEIGHT && newCol >= 0 && newCol < GRID_WIDTH) {
        player.row = newRow;
        player.col = newCol;
        displayPlayerAtPosition();
    }
}

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        if (enemy.path.length === 0 || enemy.pathIndex >= enemy.path.length) {
            const start = {
                row: Math.floor(enemy.y / TILE_SIZE),
                col: Math.floor(enemy.x / TILE_SIZE)
            };
            enemy.path = aStar(start, goal);

            if (enemy.path.length === 0) {
                enemy.stuck = true;
            } else {
                enemy.stuck = false;
                enemy.pathIndex = 0;
            }
        }

        if (!enemy.stuck && enemy.path.length > 0) {
            const target = enemy.path[enemy.pathIndex];
            const targetX = target.col * TILE_SIZE;
            const targetY = target.row * TILE_SIZE;

            if (Math.abs(enemy.x - targetX) < enemy.speed && Math.abs(enemy.y - targetY) < enemy.speed) {
                enemy.x = targetX;
                enemy.y = targetY;
                enemy.pathIndex++;
                if (checkGoalReached(enemy)) {
                    return;
                }
            } else {
                const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
                enemy.x += Math.cos(angle) * enemy.speed;
                enemy.y += Math.sin(angle) * enemy.speed;
            }

            const visualEnemy = document.querySelector(`#enemy-${index}`);
            visualEnemy.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
        }

        const distanceToGoal = calculateDistanceToGoal(enemy);
        enemyQueue.enqueue({ enemy, priority: distanceToGoal });
    });
}

function calculateDistanceToGoal(enemy) {
    const enemyRow = Math.floor(enemy.y / TILE_SIZE);
    const enemyCol = Math.floor(enemy.x / TILE_SIZE);
    return heuristic(enemyRow, enemyCol, goal.row, goal.col);
}

function placeTower() {
    const row = player.row;
    const col = player.col;

    if ([0, 3].includes(backgroundTiles[row][col])) {
        towers.push({ row, col, lastShotTime: 0 });
        addTileToBuildings(row, col, 'tower');
        console.log("Tower placed at:", row, col);
    } else {
        console.log("Cannot place tower here!");
    }
    recalculatePaths();
}

function placeFenceHori() {
    const row = player.row;
    const col = player.col;

    if ([0, 3].includes(backgroundTiles[row][col])) {
        addTileToBuildings(row, col, 'fence_hori');
        backgroundTiles[row][col] = 4;
        console.log("Horizontal fence placed at:", row, col);
    } else {
        console.log("Cannot place fence here!");
    }
    recalculatePaths();
}

function recalculatePaths() {
    enemies.forEach(enemy => {
        const start = {
            row: Math.floor(enemy.y / TILE_SIZE),
            col: Math.floor(enemy.x / TILE_SIZE)
        };
        enemy.path = aStar(start, goal);
        enemy.pathIndex = 0;
    });
}

function startSpawningEnemies() {
    setInterval(spawnEnemy, Math.random() * (10000 - 3000) + 3000);
}

function spawnEnemy() {
    const randomCol = Math.floor(Math.random() * GRID_WIDTH);
    const newEnemy = {
        x: randomCol * TILE_SIZE,
        y: 0,
        moving: false,
        health: 10,
        maxHealth: 10,
        speed: 0.2,
        regX: 0,
        regY: 0,
        path: [],
        pathIndex: 0,
        stuck: false
    };
    enemies.push(newEnemy);
    console.log("Enemy spawned:", newEnemy);
}

function startShooting() {
    setInterval(() => {
        towers.forEach(tower => {
            const now = Date.now();
            if (now - tower.lastShotTime >= 1000) { // 1 sec interval
                shootAtTarget(tower);
                tower.lastShotTime = now;
            }
        });
    }, 100);
}

function shootAtTarget(tower) {
    while (!enemyQueue.isEmpty()) {
        const target = enemyQueue.dequeue().enemy;
        if (target.health > 0) {
            shootArrow(tower, target);
            break;
        }
    }
}

function shootArrow(tower, enemy) {
    const arrow = {
        x: tower.col * TILE_SIZE,
        y: tower.row * TILE_SIZE,
        targetX: enemy.x,
        targetY: enemy.y,
        speed: 50
    };

    displayArrow(arrow);

    const damage = Math.floor(Math.random() * 2) + 1;
    enemy.health -= damage;
    console.log(`Enemy health: ${enemy.health}`);

    if (enemy.health <= 0) {
        const index = enemies.indexOf(enemy);
        if (index !== -1) {
            enemies.splice(index, 1);
            const visualEnemy = document.querySelector(`#enemy-${index}`);
            if (visualEnemy) {
                visualEnemy.remove();
            }
        }
    }
}

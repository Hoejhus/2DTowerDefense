"use strict";

import { createTiles, displayTiles, displayPlayerAtPosition, displayEnemiesAtPosition, addTileToBuildings, displayArrow, clearDebugInfo, displayDebugInfo, respawnEnemyDivs } from './view.js';
import { towers, enemies, enemyQueue, backgroundTiles, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, player, goal, heuristic, aStar, checkGoalReached } from './model.js';
import { toggleDebugMode, isDebugMode } from './debug.js';

window.addEventListener('load', start);
document.addEventListener('keydown', keyDown);

let deltaTime;
let lastTimeStamp = 0;
let score = 150;

function start() {
    console.log("Tower Defense Started");
    createTiles();
    displayTiles();
    startSpawningEnemies();
    startShooting();
    updateScoreDisplay();
    tick();
}

function tick(timestamp) {
    requestAnimationFrame(tick);
    deltaTime = (timestamp - lastTimeStamp) / 1000;
    lastTimeStamp = timestamp;

    if (isDebugMode()) {
        clearDebugInfo(); 
    }

    moveEnemies();
    displayEnemiesAtPosition();  
    displayPlayerAtPosition();

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
        case 'r':
        case 'R':
            recalculatePaths();
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
            recalculateEnemyPath(enemy, index);
        }

        if (!enemy.stuck && enemy.path.length > 0) {
            moveEnemyAlongPath(enemy, index);
        }

        const distanceToGoal = calculateDistanceToGoal(enemy);
        enemyQueue.enqueue({ enemy, priority: distanceToGoal });
    });
}

function recalculateEnemyPath(enemy, index) {
    const start = {
        row: Math.floor((enemy.y - enemy.regY) / TILE_SIZE),
        col: Math.floor((enemy.x - enemy.regX) / TILE_SIZE)
    };

    const newPath = aStar(start, goal);

    if (newPath.length === 0) {
        enemy.stuck = true;
    } else {
        enemy.stuck = false;
        enemy.path = newPath;
        enemy.pathIndex = 0;
        updateEnemyVisualPosition(enemy, index);
    }
}

function moveEnemyAlongPath(enemy, index) {
    const target = enemy.path[enemy.pathIndex];
    const targetX = (target.col + 0.5) * TILE_SIZE;
    const targetY = (target.row + 0.5) * TILE_SIZE;

    const distanceX = targetX - enemy.x;
    const distanceY = targetY - enemy.y;
    const distanceToTarget = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    let directionClass = 'down';

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
        directionClass = distanceX > 0 ? 'right' : 'left';
    } else {
        directionClass = distanceY > 0 ? 'down' : 'up';
    }

    const visualEnemy = document.querySelector(`#enemy-${index}`);
    if (visualEnemy) {
        visualEnemy.className = `enemy animate ${directionClass}`;
    }

    if (distanceToTarget < enemy.speed) {
        enemy.x = targetX;
        enemy.y = targetY;
        enemy.pathIndex++;
        if (checkGoalReached(enemy)) {
            return;
        }
    } else {
        const angle = Math.atan2(distanceY, distanceX);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
    }

    updateEnemyVisualPosition(enemy, index);
}

function updateEnemyVisualPosition(enemy, index) {
    const visualEnemy = document.querySelector(`#enemy-${index}`);
    if (visualEnemy) {
        visualEnemy.style.transform = `translate(${enemy.x - enemy.regX}px, ${enemy.y - enemy.regY}px)`;
    }
}

function calculateDistanceToGoal(enemy) {
    const enemyRow = Math.floor(enemy.y / TILE_SIZE);
    const enemyCol = Math.floor(enemy.x / TILE_SIZE);
    return heuristic(enemyRow, enemyCol, goal.row, goal.col);
}

function placeTower() {
    if (score >= 100) {
        const row = player.row;
        const col = player.col;

        if ([0, 3].includes(backgroundTiles[row][col])) {
            towers.push({ row, col, lastShotTime: 0, range: 3 * TILE_SIZE });
            addTileToBuildings(row, col, 'tower');
            console.log("Tower placed at:", row, col);
            score -= 100;
            updateScoreDisplay();
            recalculatePaths();
        } else {
            console.log("Cannot place tower here!");
        }
    } else {
        console.log("Not enough points to place a tower!");
    }
}

function placeFenceHori() {
    if (score >= 50) {
        const row = player.row;
        const col = player.col;

        const isTowerHere = towers.some(tower => tower.row === row && tower.col === col);

        if (!isTowerHere && [0, 3].includes(backgroundTiles[row][col])) {
            addTileToBuildings(row, col, 'fence_hori');
            backgroundTiles[row][col] = 4;
            console.log("Horizontal fence placed at:", row, col);
            score -= 50;
            updateScoreDisplay();
            recalculatePaths();
        } else {
            console.log("Cannot place fence here!");
        }
    } else {
        console.log("Not enough points to place a fence!");
    }
}

function recalculatePaths() {
    enemies.forEach(enemy => {
        const start = {
            row: Math.floor(enemy.y / TILE_SIZE),
            col: Math.floor(enemy.x / TILE_SIZE)
        };

        const newPath = aStar(start, goal);

        if (newPath.length > 0) {
            enemy.path = newPath;
            enemy.pathIndex = 0;
        }
    });
}

function startSpawningEnemies() {
    setInterval(spawnEnemy, Math.random() * (10000 - 3000) + 3000);
}

function spawnEnemy() {
    const randomCol = Math.floor(Math.random() * GRID_WIDTH);
    const newEnemy = {
        x: (randomCol + 0.5) * TILE_SIZE,
        y: 0.5 * TILE_SIZE,
        regX: 0.5 * TILE_SIZE,
        regY: 0.5 * TILE_SIZE,
        moving: false,
        health: 10,
        maxHealth: 10,
        speed: 0.2,
        path: [],
        pathIndex: 0,
        stuck: false
    };
    newEnemy.path = aStar({ row: 0, col: randomCol }, goal);
    enemies.push(newEnemy);
    console.log("Enemy spawned:", newEnemy);
}

function startShooting() {
    setInterval(() => {
        towers.forEach(tower => {
            const now = Date.now();
            if (now - tower.lastShotTime >= 1000) {
                shootAtTarget(tower);
                tower.lastShotTime = now;
            }
        });
    }, 100);
}

function shootAtTarget(tower) {
    enemies.forEach(enemy => {
        const distanceX = enemy.x - tower.col * TILE_SIZE;
        const distanceY = enemy.y - tower.row * TILE_SIZE;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance <= tower.range) {
            shootArrow(tower, enemy);
        }
    });
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

    const damage = Math.floor(Math.random() * 2);
    enemy.health -= damage;
    console.log(`Enemy health: ${enemy.health}`);

    score += 10;
    updateScoreDisplay();

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

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Money: ${score}`;
    }
}
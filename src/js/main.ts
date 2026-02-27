
import { resolvePotentialCollisions } from './helpers/collision-resolvers';
import { addDebuggerMessage, debuggerMessages, drawLegend } from './helpers/debugger';
import { computeRays } from './helpers/ray-caster';
import { updateOrientation, updatePosition } from './helpers/movement';
import { player } from './helpers/player';
import { drawBlocks, drawPlayer, drawRays, emptyCanvas } from './helpers/drawer';
import { drawRaysAsWalls } from './helpers/first-person-drawer';

//draw interval in frames per second
export const FPS = 50

const bla = () =>player.coords = resolvePotentialCollisions({x:0, y:0})

let timeBeforeNewInterval = Date.now();

setInterval(() => {
    debuggerMessages.splice(0, debuggerMessages.length);
    const now = Date.now();
    addDebuggerMessage(`Actual time between 2 frames: ${now - timeBeforeNewInterval};`)
    timeBeforeNewInterval = now;

    emptyCanvas();

    updateOrientation();

    updatePosition();

    drawBlocks();

    computeRays();

    drawRays();

    drawPlayer();

    drawRaysAsWalls();

    drawLegend();

}, 1000/FPS)

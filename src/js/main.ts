
import { resolvePotentialCollisions } from './helpers/collision-resolvers';
import { addDebuggerMessage, debuggerMessages, drawLegend } from './helpers/debugger';
import { computeRays } from './helpers/ray-caster';
import { updateOrientation, updatePosition } from './helpers/movement';
import { drawBlocks, drawPlayer, drawRays, emptyCanvas } from './helpers/drawer';
import { drawRaysAsWallsAndFloors } from './helpers/first-person-drawer';

//draw interval in frames per second
export const FPS = 50

const bla = () =>  resolvePotentialCollisions({x:0, y:0})// daca sterg asta, crapa, wtf, probabil ceva cu ordinea importurilor

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

    drawRaysAsWallsAndFloors();

    addDebuggerMessage(`Time to render a frame: ${Date.now() - now};`)
    drawLegend();


}, 1000/FPS);

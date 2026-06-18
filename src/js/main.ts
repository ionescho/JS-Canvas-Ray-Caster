
import { addDebuggerMessage, debuggerMessages, drawLegend } from './helpers/debugger';
import { computeRays } from './helpers/ray-caster';
import { updateOrientation, updatePosition } from './helpers/movement';
import { drawBlocks, drawPlayer, drawRays, drawSprites, emptyCanvas } from './helpers/drawer';
import { drawRaysAsWallsAndFloors } from './helpers/first-person-rasterizer-and-drawer';
import { parseWallTextureConfig } from './helpers/blocks';
import { CONFIG } from './helpers/config';


const start = () => {
    let timeBeforeNewInterval = Date.now();
    
    setInterval(() => {
        debuggerMessages.length = 0;
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
    
        drawSprites();
    
        drawRaysAsWallsAndFloors();
    
        addDebuggerMessage(`Time to render a frame: ${Date.now() - now};`)
        drawLegend();
    
    
    }, 1000/CONFIG.FPS);
}

(async () => {
    await parseWallTextureConfig();

    start();
})()
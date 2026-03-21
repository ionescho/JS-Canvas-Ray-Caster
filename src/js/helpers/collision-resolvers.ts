import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { CANVAS_DIMENSIONS, Coords } from "./drawer";
import { addDebuggerMessage, roundDec2 } from "./debugger";
import { player, PLAYER_SQUARE_SIZE } from "./player";
import { addVec, scalarMulVec, subVec } from "./vectorOperations";

const checkEdgeOfScreenCollisions = (potentialFuturePlayerPos: Coords): Coords => {

    // collision edge of screen
    if(potentialFuturePlayerPos.x < 0) {
        potentialFuturePlayerPos.x = 0
    }
    if(potentialFuturePlayerPos.x > CANVAS_DIMENSIONS.x) {
        potentialFuturePlayerPos.x = CANVAS_DIMENSIONS.x
    }
    if(potentialFuturePlayerPos.y < 0) {
        potentialFuturePlayerPos.y = 0
    }
    if(potentialFuturePlayerPos.y > CANVAS_DIMENSIONS.y) {
        potentialFuturePlayerPos.y = CANVAS_DIMENSIONS.y
    }

    return potentialFuturePlayerPos;

}

const checkPlayerBlockCollision = (potentialFuturePlayerPos: Coords, blockX: number, blockY: number, isGoingUp: boolean, isGoingLeft: boolean): Coords | false => {
    //calculate player bounds
    const potentialFuturePlayerBounds = {
        start: {
            x: potentialFuturePlayerPos.x - PLAYER_SQUARE_SIZE.x / 2,
            y: potentialFuturePlayerPos.y - PLAYER_SQUARE_SIZE.y / 2
        },
        end: {
            x: potentialFuturePlayerPos.x + PLAYER_SQUARE_SIZE.x / 2,
            y: potentialFuturePlayerPos.y + PLAYER_SQUARE_SIZE.y / 2
        }
    }
    addDebuggerMessage(`Player start ${roundDec2(potentialFuturePlayerBounds.start.x)},${roundDec2(potentialFuturePlayerBounds.start.y)} with end: (${roundDec2(potentialFuturePlayerBounds.end.x)}, ${roundDec2(potentialFuturePlayerBounds.end.y)})`);

    //calculate block bounds
    const block = {
        start: {
            x: blockX * blockDimensions.x,
            y: blockY * blockDimensions.y
        },
        end: {
            x: (blockX + 1) * blockDimensions.x,
            y: (blockY + 1) * blockDimensions.y
        }
    }
    addDebuggerMessage(`Block to check start ${roundDec2(block.start.x)},${roundDec2(block.start.y)} with end: (${roundDec2(block.end.x)}, ${roundDec2(block.end.y)})`);

    //calculate penetration based on the former 2
    const penetration = {
        x: isGoingLeft ? block.end.x - potentialFuturePlayerBounds.start.x : potentialFuturePlayerBounds.end.x - block.start.x,
        y: isGoingUp ? block.end.y - potentialFuturePlayerBounds.start.y : potentialFuturePlayerBounds.end.y - block.start.y,
    }
    if(penetration.x > 0 && penetration.y > 0) {
        addDebuggerMessage(`Collision with block ${blockX},${blockY} with penetrations: (${roundDec2(penetration.x)}, ${roundDec2(penetration.y)})`);
        // means we have a collision, this part gets tricky
        // we need to undo and resolve the penetration and we do that by:

        // 1 calculating the time to undo the penetration ( find out which of the 2 axis of penetration(x or y) is quickest to close and and set that time as the undo time)
        const timeToUndoPenetrationX = penetration.x / Math.abs(player.movement.speedVector.x)
        const timeToUndoPenetrationY = penetration.y / Math.abs(player.movement.speedVector.y)
        const timeToUndoPenetration = Math.min(timeToUndoPenetrationX, timeToUndoPenetrationY);

        // 2 calculating the position immediately before collision  (by going backwards along the player's trajectory)
        const correctedPosImmediatelyBeforeCollision = subVec(potentialFuturePlayerPos, scalarMulVec(player.movement.speedVector, timeToUndoPenetration))

        // 3 calculating  a different potential future position, and movement direction and speed based on the new conditions
        if(timeToUndoPenetrationX < timeToUndoPenetrationY) {// the movement is now restricted alongside only one of the 2 axis
            player.movement.speedVector.x = 0;
        } else {
            player.movement.speedVector.y = 0;
        }

        return addVec(correctedPosImmediatelyBeforeCollision, scalarMulVec(player.movement.speedVector, timeToUndoPenetration)) // this is the new future potential player position after the collision resolution with this particular block
    }
    return false;
}

export const resolvePotentialCollisions = (potentialFuturePlayerPos: Coords) => {

    //first determine which block(sector) the player center is in
    const playerSector = player.getSector();
    addDebuggerMessage(`Sector(X,Y): (${playerSector.x + 1}, ${playerSector.y + 1})`);
    
    //then determine which direction the player is looking towards(up, left, down, right)
    let isGoingUp = player.movement.speedVector.y < 0;
    let isGoingLeft = player.movement.speedVector.x < 0;
    addDebuggerMessage(`Going: (${isGoingUp ? 'Up':'Down'}, ${isGoingLeft? 'Left' : 'Right'})`);
 

    const blocksToCheckXIndexDiff = isGoingLeft ? -1 : 1;
    const blocksToCheckYIndexDiff = isGoingUp ? -1 : 1;
    const collisionCheckBlockIndexes: Coords[] = [
        {x: playerSector.x, y: playerSector.y + blocksToCheckYIndexDiff}, // block along y axis
        {x: playerSector.x + blocksToCheckXIndexDiff, y: playerSector.y}, // block along x axis
        {x: playerSector.x + blocksToCheckXIndexDiff, y: playerSector.y + blocksToCheckYIndexDiff} // diagonal block
    ];
    let resolutionCollision: Coords | false = false;
    collisionCheckBlockIndexes.forEach(({x, y}) => {
        if(BLOCKS_ARRAY[y]?.[x] >= 1) {
            resolutionCollision = checkPlayerBlockCollision(potentialFuturePlayerPos, x, y, isGoingUp, isGoingLeft);
        }
        if(resolutionCollision) {
            potentialFuturePlayerPos = resolutionCollision;
        }
    })

    potentialFuturePlayerPos = checkEdgeOfScreenCollisions(potentialFuturePlayerPos);

    return potentialFuturePlayerPos

}
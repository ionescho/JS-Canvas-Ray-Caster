import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { addDebuggerMessage, roundDec2 } from "./debugger";
import { CANVAS_DIMENSIONS, Coords, drawLine, drawRect } from "./drawer";
import { player } from "./player";

const FIELD_OF_VIEW_ANGLE = Math.PI/3;
const FIELD_OF_VIEW_RAY_SPREAD = 0.03;

const SCREEN_EDGE_UP_Y = CANVAS_DIMENSIONS.y / 2;
const SCREEN_EDGE_DOWN_Y = - CANVAS_DIMENSIONS.y / 2;

const castRayUntilHorizontalCollision = (startingPoint: Coords, orientationAngle: number) => {
   const isGoingUp = orientationAngle > 3 * Math.PI/2 || orientationAngle < Math.PI/2;
   
   if(isGoingUp) {
        const yDistanceToFirstBlock = startingPoint.y < 0 ? Math.abs(startingPoint.y % blockDimensions.y) : blockDimensions.y - (startingPoint.y % blockDimensions.y)

        const intersection = {
            x: startingPoint.x + Math.tan(orientationAngle) * yDistanceToFirstBlock,
            y: startingPoint.y + yDistanceToFirstBlock
        }

        // addDebuggerMessage(`yDistanceToFirstBlock: ${yDistanceToFirstBlock}`);
        // addDebuggerMessage(`yIntersection: ${intersection.y}`);

        if(intersection.y != SCREEN_EDGE_UP_Y) {
            let getBlockAtIntersection = (intersection: Coords) => {        
                const blockRowIndex = Math.round((CANVAS_DIMENSIONS.y / 2 - intersection.y)/blockDimensions.y - 1);
                const blockColIndex = Math.floor((CANVAS_DIMENSIONS.x / 2 + intersection.x)/blockDimensions.x);
                // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
                return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
            }
            let correspondingBlockAtIntersection = getBlockAtIntersection(intersection);

            while(intersection.y !== SCREEN_EDGE_UP_Y && correspondingBlockAtIntersection == 0) {
                intersection.y += blockDimensions.y;
                intersection.x += Math.tan(orientationAngle)*blockDimensions.y

                correspondingBlockAtIntersection = getBlockAtIntersection(intersection);
            }

            if(correspondingBlockAtIntersection === 1) {
                // ray hit a wall!
                drawLine(player.coords, {x: intersection.x, y: intersection.y}, 2, 'red')
            }
        }
   } else {
        const yDistanceToFirstBlock = startingPoint.y < 0 ? blockDimensions.y - Math.abs(startingPoint.y % blockDimensions.y) : startingPoint.y % blockDimensions.y

        const intersection = {
            x: startingPoint.x - Math.tan(orientationAngle) * yDistanceToFirstBlock,
            y: startingPoint.y - yDistanceToFirstBlock
        }

        // addDebuggerMessage(`yDistanceToFirstBlock: ${yDistanceToFirstBlock}`);
        // addDebuggerMessage(`yIntersection: ${intersection.y}`);

        if(intersection.y != SCREEN_EDGE_DOWN_Y) {
            let getBlockAtIntersection = (intersection: Coords) => {        
                const blockRowIndex = Math.round((CANVAS_DIMENSIONS.y / 2 - intersection.y)/blockDimensions.y);
                const blockColIndex = Math.floor((CANVAS_DIMENSIONS.x / 2 + intersection.x)/blockDimensions.x);
                // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
                return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
            }
            let correspondingBlockAtIntersection = getBlockAtIntersection(intersection);

            while(intersection.y !== SCREEN_EDGE_DOWN_Y && correspondingBlockAtIntersection == 0) {
                intersection.y -= blockDimensions.y;
                intersection.x -= Math.tan(orientationAngle)*blockDimensions.y

                correspondingBlockAtIntersection = getBlockAtIntersection(intersection);
            }

            if(correspondingBlockAtIntersection === 1) {
                // ray hit a wall!
                drawLine(player.coords, {x: intersection.x, y: intersection.y}, 2, 'red')
            }
        }
   }
}

const castRayUntilVerticalCollision = (startingPoint: Coords, orientationAngle: number) => {
    const isGoingLeft = orientationAngle > Math.PI;
    
}

export const castRays = () => {

    let fieldOfViewAngle = player.orientation.angle - FIELD_OF_VIEW_ANGLE; // field of view start
    let fieldOfViewEnd = player.orientation.angle + FIELD_OF_VIEW_ANGLE
    while(fieldOfViewAngle < fieldOfViewEnd) {
        castRayUntilHorizontalCollision(player.coords, fieldOfViewAngle)
        fieldOfViewAngle += FIELD_OF_VIEW_RAY_SPREAD;
    }
    // let message = `${roundDec2(fieldOfViewAngle)} - ${roundDec2(fieldOfViewEnd)} : iterations: ${roundDec2(fieldOfViewAngle)},`
    // message += `${roundDec2(fieldOfViewAngle)},`;
    // addDebuggerMessage(message)
}
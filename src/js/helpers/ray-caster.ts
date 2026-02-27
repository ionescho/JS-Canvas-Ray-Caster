import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { addDebuggerMessage, roundDec2 } from "./debugger";
import { CANVAS_DIMENSIONS, Coords, drawLine } from "./drawer";
import { player } from "./player";
import { scalarMulVec, subVec } from "./vectorOperations";

const FIELD_OF_VIEW_ANGLE = Math.PI/3;
const FIELD_OF_VIEW_RAY_INTERVAL = 0.01;

export type Ray = {
    end: Coords,
    coordsSum: number,
}

export let rays: Ray[] = [];

const castRayUntilHorizontalCollision = (startingPoint: Coords, orientationAngle: number) => {
    const SCREEN_END: Coords = scalarMulVec( CANVAS_DIMENSIONS, 1/2)
    const isGoingAlongAxis = orientationAngle > 3 * Math.PI/2 || orientationAngle < Math.PI/2;

    const operationModifier = isGoingAlongAxis ? 1 : -1;

    let yDistanceToFirstBlock
    if(isGoingAlongAxis) {
        yDistanceToFirstBlock = startingPoint.y < 0 ? Math.abs(startingPoint.y % blockDimensions.y) : blockDimensions.y - (startingPoint.y % blockDimensions.y)
    } else {
        yDistanceToFirstBlock = startingPoint.y < 0 ? blockDimensions.y + (startingPoint.y % blockDimensions.y) : startingPoint.y % blockDimensions.y
    }

    const intersection = {
        x: startingPoint.x + operationModifier * Math.tan(orientationAngle) * yDistanceToFirstBlock,
        y: startingPoint.y + operationModifier * yDistanceToFirstBlock
    }

    // addDebuggerMessage(`yDistanceToFirstBlock: ${yDistanceToFirstBlock}`);
    // addDebuggerMessage(`yIntersection: ${intersection.y}`);

    let getBlockAtIntersection = (intersection: Coords) => {        
        const blockRowIndex = Math.round((SCREEN_END.y - intersection.y)/blockDimensions.y) + (isGoingAlongAxis ? - 1 : 0);
        const blockColIndex = Math.floor((SCREEN_END.x + intersection.x)/blockDimensions.x);
        // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
        return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
    }
    let correspondingBlockAtIntersection = getBlockAtIntersection(intersection);

    while(Math.abs(intersection.x) < SCREEN_END.x && Math.abs(intersection.y) < SCREEN_END.y && !correspondingBlockAtIntersection) {
        intersection.x = intersection.x + operationModifier * Math.tan(orientationAngle) * blockDimensions.y
        intersection.y = intersection.y + operationModifier * blockDimensions.y;

        correspondingBlockAtIntersection = getBlockAtIntersection(intersection);
    }

    return intersection
}

const castRayUntilVerticalCollision = (startingPoint: Coords, orientationAngle: number) => {
    const SCREEN_END: Coords = scalarMulVec( CANVAS_DIMENSIONS, 1/2)
    const isGoingAlongAxis = orientationAngle < Math.PI;

    const operationModifier = isGoingAlongAxis ? 1 : -1;

    let xDistanceToFirstBlock;
    if(isGoingAlongAxis) {
        xDistanceToFirstBlock = startingPoint.x < 0 ? Math.abs(startingPoint.x % blockDimensions.x) : blockDimensions.x - (startingPoint.x % blockDimensions.x)
    } else {
        xDistanceToFirstBlock = startingPoint.x < 0 ? blockDimensions.x + (startingPoint.x % blockDimensions.x) : startingPoint.x % blockDimensions.x
    }

    const intersection = {
        x: startingPoint.x + operationModifier * xDistanceToFirstBlock,
        y: startingPoint.y + operationModifier * (1/Math.tan(orientationAngle)) * xDistanceToFirstBlock
    }

    // addDebuggerMessage(`xDistanceToFirstBlock: ${xDistanceToFirstBlock}`);
    // addDebuggerMessage(`yIntersection: ${intersection.y}`);

    let getBlockAtIntersection = (intersection: Coords) => {        
        const blockRowIndex = Math.floor((SCREEN_END.y - intersection.y)/blockDimensions.y);
        const blockColIndex = Math.round((SCREEN_END.x + intersection.x)/blockDimensions.x) + (isGoingAlongAxis ? 0 : -1);
        // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
        return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
    }
    let correspondingBlockAtIntersection = getBlockAtIntersection(intersection);

    while(Math.abs(intersection.x) < SCREEN_END.x && Math.abs(intersection.y) < SCREEN_END.y && !correspondingBlockAtIntersection) {
        intersection.x = intersection.x + operationModifier * blockDimensions.x;
        intersection.y = intersection.y + operationModifier * (1/Math.tan(orientationAngle)) * blockDimensions.x;

        correspondingBlockAtIntersection = getBlockAtIntersection(intersection);
    }

    return intersection;
}

export const computeRays = () => {

    let fieldOfViewAngle = player.orientation.angle - FIELD_OF_VIEW_ANGLE; // field of view start
    if(fieldOfViewAngle < 0) {
        fieldOfViewAngle += Math.PI * 2
    }
    let fieldOfViewEnd = fieldOfViewAngle + 2 * FIELD_OF_VIEW_ANGLE
    let message = `${roundDec2(fieldOfViewAngle)} - ${roundDec2(fieldOfViewEnd)} : iterations: ${roundDec2(fieldOfViewAngle)},`;
    rays.length = 0;// empty rays array fastest method
    while(fieldOfViewAngle < fieldOfViewEnd) {
        const normalizedFieldOfViewAngle = fieldOfViewAngle % (Math.PI * 2)

        const intersectionHorizontal = castRayUntilHorizontalCollision(player.coords, normalizedFieldOfViewAngle);
        const intersectionVertical = castRayUntilVerticalCollision(player.coords, normalizedFieldOfViewAngle);

        const distVecHorizontal = subVec(intersectionHorizontal, player.coords);
        const distVecVertical = subVec(intersectionVertical, player.coords);

        const coordsSumHorizontal = Math.abs(distVecHorizontal?.x || 0) + Math.abs(distVecHorizontal?.y || 0);
        const coordsSumVertical = Math.abs(distVecVertical?.x || 0) + Math.abs(distVecVertical?.y || 0);

        const finalIntersection = coordsSumHorizontal < coordsSumVertical ? intersectionHorizontal : intersectionVertical;


        //     drawLine(player.coords, intersectionVertical, 5, 'blue')
        //     drawLine(player.coords, intersectionHorizontal, 2, 'yellow')
        rays.push({
            end: finalIntersection,
            coordsSum: Math.min(coordsSumHorizontal, coordsSumVertical)
        });
        // drawLine(player.coords, finalIntersection, 2, 'red')
        
        fieldOfViewAngle += FIELD_OF_VIEW_RAY_INTERVAL;
    }
    // message += `${roundDec2(fieldOfViewAngle)},`;
    addDebuggerMessage(message)
}
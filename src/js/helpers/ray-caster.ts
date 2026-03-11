import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { CONFIG, configObservable } from "./config";
import { addDebuggerMessage, roundDec2 } from "./debugger";
import { Coords, SCREEN_END } from "./drawer";
import { FIRST_PERSON_CANVAS_DIMENSIONS } from "./first-person-drawer";
import { player } from "./player";
import { subVec } from "./vectorOperations";

export type Ray = {
    end: Coords;
    magnitude: number;
    angleFromOrientation: number;
    previousRayAngleDelta: number;
    angle: number;
    horizontalCollision?: boolean;// true if horizontal collision, false if vertical
    hitBlockRelativePos?: false | number;// false if ray hasn't hit a block( so it went off the edge of the screen) or a ratio representing where it hit the block( useful for texture mapping later )
}

export let rays: Ray[];

let circularProjectionRays: Ray[];
let projectionPlaneRays: Ray[];

const initRayArrays = () => {
    const FIELD_OF_VIEW_RAY_INTERVAL = 0.001;

    //circular projection
    circularProjectionRays = Array.from({ length: Math.floor(CONFIG.HALF_FIELD_OF_VIEW * 2 / FIELD_OF_VIEW_RAY_INTERVAL) }, (v, i) => ({ 
        angle: 0,
        angleFromOrientation: CONFIG.HALF_FIELD_OF_VIEW - ( FIELD_OF_VIEW_RAY_INTERVAL * i ),
        previousRayAngleDelta: FIELD_OF_VIEW_RAY_INTERVAL,
        magnitude: 0,
        end: {x: 0, y: 0}
    }));
    
    //projection plane
    let prevAngle = CONFIG.HALF_FIELD_OF_VIEW;
    const pixels = FIRST_PERSON_CANVAS_DIMENSIONS.x
    const halfFieldOfViewLength = Math.tan(CONFIG.HALF_FIELD_OF_VIEW)
    projectionPlaneRays = Array.from({ length: pixels }, (v, i) => {
        const currAngle = Math.atan(halfFieldOfViewLength * ( 1 - 2 * i / pixels ));// angle between player orientation and currently iterated ray
        const angleDiff = prevAngle - currAngle;
    
        prevAngle = currAngle;
    
        return {
            angle: 0,
            angleFromOrientation: currAngle,
            previousRayAngleDelta: angleDiff,
            end: {x: 0, y: 0},
            magnitude: 0,
            hitBlock: false,
        }
    })

    if(CONFIG.rayCastingType === 'circular') {
        rays = circularProjectionRays;
    } else {
        rays = projectionPlaneRays;

    }
}

initRayArrays();
configObservable.registerListener(initRayArrays)

export const computeRays = () => {

    if(CONFIG.rayCastingType === 'circular') {
        rays = circularProjectionRays;
    } else {
        rays = projectionPlaneRays;

    }

    let fieldOfViewAngleStart = player.orientation.angle - CONFIG.HALF_FIELD_OF_VIEW; // field of view start
    if(fieldOfViewAngleStart < 0) {
        fieldOfViewAngleStart += Math.PI * 2
    }
    rays[0].angle = fieldOfViewAngleStart;
    rays.forEach((ray: Ray, index) => {
        if(index > 0) {
            ray.angle = rays[index - 1].angle + ray.previousRayAngleDelta
            if (ray.angle > Math.PI * 2) {
                ray.angle -= Math.PI * 2
            }
        }

        const {intersection: intersectionHorizontal, hitBlock: hitBlockHorizontal} = castRayUntilHorizontalCollision(player.coords, ray.angle);
        const {intersection: intersectionVertical, hitBlock: hitBlockVertical} = castRayUntilVerticalCollision(player.coords, ray.angle);

        // const {intersection: intersectionHorizontal, hitBlock: hitBlockHorizontal} = castRayUntilCollision(player.coords, ray.angle, 'horizontal');
        // const {intersection: intersectionVertical, hitBlock: hitBlockVertical} = castRayUntilCollision(player.coords, ray.angle, 'vertical');

        const distVecHorizontal = subVec(intersectionHorizontal, player.coords);
        const distVecVertical = subVec(intersectionVertical, player.coords);

        const coordsSumHorizontal = Math.abs(distVecHorizontal?.x || 0) + Math.abs(distVecHorizontal?.y || 0);
        const coordsSumVertical = Math.abs(distVecVertical?.x || 0) + Math.abs(distVecVertical?.y || 0);

        let finalIntersection: Coords;
        let magnitude: number;
        let horizontalCollision = false;
        let hitBlock: false | number;
        if (coordsSumHorizontal < coordsSumVertical) {
            finalIntersection = intersectionHorizontal;
            magnitude = Math.sqrt( distVecHorizontal.x ** 2 + distVecHorizontal.y ** 2 );
            horizontalCollision = true;
            hitBlock = hitBlockHorizontal ? (intersectionHorizontal.x % blockDimensions.x)/ blockDimensions.x : false;
        } else {
            finalIntersection = intersectionVertical;
            magnitude = Math.sqrt( distVecVertical.x ** 2 + distVecVertical.y ** 2 );
            hitBlock = hitBlockVertical ? (intersectionVertical.y % blockDimensions.y)/ blockDimensions.y : false;
        }


        // drawLine(player.coords, intersectionVertical, 5, 'blue')
        // drawLine(player.coords, intersectionHorizontal, 2, 'yellow')
        // drawLine(player.coords, finalIntersection, 2, 'red')
        
        ray.end = finalIntersection;
        ray.magnitude = magnitude;
        ray.horizontalCollision = horizontalCollision;
        ray.hitBlockRelativePos = hitBlock ? Math.abs(hitBlock) : false;
    });
    // message += `${roundDec2(fieldOfViewAngle)},`;
    // addDebuggerMessage(message)
}

const getBlockAtHorizontalIntersection = (intersection: Coords, isGoingAlongAxis: boolean) => {
    const blockRowIndex = Math.floor((SCREEN_END.y - intersection.y)/blockDimensions.y) + (isGoingAlongAxis ? - 1 : 0);
    const blockColIndex = Math.floor((SCREEN_END.x + intersection.x)/blockDimensions.x);
    return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
}

const castRayUntilHorizontalCollision = (startingPoint: Coords, orientationAngle: number) => {
    const isGoingAlongAxis = orientationAngle > 3 * Math.PI/2 || orientationAngle < Math.PI/2;

    let yDistanceToFirstBlock
    if(isGoingAlongAxis) {
        yDistanceToFirstBlock = startingPoint.y < 0 ? Math.abs(startingPoint.y % blockDimensions.y) : blockDimensions.y - (startingPoint.y % blockDimensions.y)
    } else {
        yDistanceToFirstBlock = startingPoint.y < 0 ? blockDimensions.y + (startingPoint.y % blockDimensions.y) : startingPoint.y % blockDimensions.y
    }

    const operationModifier = isGoingAlongAxis ? 1 : -1;
    const xyRatio = Math.tan(orientationAngle);
    const intersection = {
        x: startingPoint.x + operationModifier * xyRatio * yDistanceToFirstBlock,
        y: startingPoint.y + operationModifier * yDistanceToFirstBlock
    }
    let correspondingBlockAtIntersection = getBlockAtHorizontalIntersection(intersection, isGoingAlongAxis);

    const deltaX = operationModifier * xyRatio * blockDimensions.y;
    const deltaY = operationModifier * blockDimensions.y;
    while(Math.abs(intersection.x) < SCREEN_END.x && Math.abs(intersection.y) < SCREEN_END.y && !correspondingBlockAtIntersection) {
        intersection.x += deltaX
        intersection.y += deltaY;

        correspondingBlockAtIntersection = getBlockAtHorizontalIntersection(intersection, isGoingAlongAxis);
    }


    return {
        intersection,
        hitBlock: !!correspondingBlockAtIntersection,
    };
}

const getBlockAtVerticalIntersection = (intersection: Coords, isGoingAlongAxis: boolean) => {
        const blockRowIndex = Math.floor((SCREEN_END.y - intersection.y)/blockDimensions.y);
        const blockColIndex = Math.floor((SCREEN_END.x + intersection.x)/blockDimensions.x) + (isGoingAlongAxis ? 0 : -1);
        return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
}

const castRayUntilVerticalCollision = (startingPoint: Coords, orientationAngle: number) => {
    const isGoingAlongAxis = orientationAngle < Math.PI;

    let xDistanceToFirstBlock;
    if(isGoingAlongAxis) {
        xDistanceToFirstBlock = startingPoint.x < 0 ? Math.abs(startingPoint.x % blockDimensions.x) : blockDimensions.x - (startingPoint.x % blockDimensions.x)
    } else {
        xDistanceToFirstBlock = startingPoint.x < 0 ? blockDimensions.x + (startingPoint.x % blockDimensions.x) : startingPoint.x % blockDimensions.x
    }

    const operationModifier = isGoingAlongAxis ? 1 : -1;
    const yxRatio = 1/Math.tan(orientationAngle)
    const intersection = {
        x: startingPoint.x + operationModifier * xDistanceToFirstBlock,
        y: startingPoint.y + operationModifier * yxRatio * xDistanceToFirstBlock
    }
    let correspondingBlockAtIntersection = getBlockAtVerticalIntersection(intersection, isGoingAlongAxis);

    const deltaX = operationModifier * blockDimensions.x;
    const deltaY = operationModifier * yxRatio * blockDimensions.x;
    while(Math.abs(intersection.x) < SCREEN_END.x && Math.abs(intersection.y) < SCREEN_END.y && !correspondingBlockAtIntersection) {
        intersection.x += deltaX;
        intersection.y += deltaY;

        correspondingBlockAtIntersection = getBlockAtVerticalIntersection(intersection, isGoingAlongAxis);
    }

    return {
        intersection,
        hitBlock: !!correspondingBlockAtIntersection,
    };
}


// I unified the horizontal and vertical collision function but noticed framerate was a bit slower for some reason( less than 1ms slower for 1000 rays per radian)
// const getBlockAtIntersection = (intersection: Coords, mainAxis: 'x' | 'y', isGoingAlongAxis: boolean) => {
//     const blockRowIndex = Math.floor((SCREEN_END.y - intersection.y)/blockDimensions.y) + ( mainAxis === 'y' && isGoingAlongAxis ? -1 : 0 );
//     const blockColIndex = Math.floor((SCREEN_END.x + intersection.x)/blockDimensions.x) + (mainAxis === 'x' && !isGoingAlongAxis ? -1 : 0);
//     // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
//     return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
// }

// const castRayUntilCollision = (startingPoint: Coords, orientationAngle: number, collisionType: 'vertical' | 'horizontal') => {
//     const mainAxis = collisionType === 'vertical' ? 'x' : 'y';
//     const crossAxis = mainAxis === 'x' ? 'y' : 'x';

//     let isGoingAlongMainAxis: boolean;
//     if(mainAxis === 'x') {
//         isGoingAlongMainAxis = orientationAngle < Math.PI;
//     } else {
//         isGoingAlongMainAxis = orientationAngle > 3 * Math.PI/2 || orientationAngle < Math.PI/2;
//     }

//     let mainAxisDistanceToFirstBlock
//     if(isGoingAlongMainAxis) {
//         mainAxisDistanceToFirstBlock = startingPoint[mainAxis] < 0 ? Math.abs(startingPoint[mainAxis] % blockDimensions[mainAxis]) : blockDimensions[mainAxis] - (startingPoint[mainAxis] % blockDimensions[mainAxis])
//     } else {
//         mainAxisDistanceToFirstBlock = startingPoint[mainAxis] < 0 ? blockDimensions[mainAxis] + (startingPoint[mainAxis] % blockDimensions[mainAxis]) : startingPoint[mainAxis] % blockDimensions[mainAxis]
//     }

//     const operationModifier = isGoingAlongMainAxis ? 1 : -1;
//     const crossAxisRatio = crossAxis === 'x' ? Math.tan(orientationAngle) : 1/Math.tan(orientationAngle)
//     const intersection = {
//         [mainAxis]: startingPoint[mainAxis] + operationModifier * mainAxisDistanceToFirstBlock,
//         [crossAxis]: startingPoint[crossAxis] + operationModifier * crossAxisRatio * mainAxisDistanceToFirstBlock,
//     } as Coords;
//     let correspondingBlockAtIntersection = getBlockAtIntersection(intersection, mainAxis, isGoingAlongMainAxis);

//     const deltaMainAxis = operationModifier * blockDimensions[mainAxis];
//     const deltaCrossAxis = operationModifier * crossAxisRatio * blockDimensions[mainAxis];
//     while(Math.abs(intersection.x) < SCREEN_END.x && Math.abs(intersection.y) < SCREEN_END.y && !correspondingBlockAtIntersection) {
//         intersection[mainAxis] += deltaMainAxis;
//         intersection[crossAxis] += deltaCrossAxis;

//         correspondingBlockAtIntersection = getBlockAtIntersection(intersection, mainAxis, isGoingAlongMainAxis);
//     }


//     return {
//         intersection,
//         hitBlock: !!correspondingBlockAtIntersection,
//     };
// }
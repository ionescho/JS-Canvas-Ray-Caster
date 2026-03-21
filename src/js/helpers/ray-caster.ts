import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { CONFIG, configObservable } from "./config";
import { addDebuggerMessage, roundDec2 } from "./debugger";
import { CANVAS_DIMENSIONS, Coords, SCREEN_END } from "./drawer";
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

    let fieldOfViewAngleStart = player.orientation.angle + CONFIG.HALF_FIELD_OF_VIEW; // field of view start
    if(fieldOfViewAngleStart > Math.PI * 2) {
        fieldOfViewAngleStart -= Math.PI * 2
    }
    rays[0].angle = fieldOfViewAngleStart;
    rays.forEach((ray: Ray, index) => {
        if(index > 0) {
            ray.angle = rays[index - 1].angle - ray.previousRayAngleDelta
            if (ray.angle < 0) {
                ray.angle += Math.PI * 2
            }
        }

        const {intersection: intersectionHorizontal, hitBlock: hitBlockHorizontal} = castRayUntilCollision(player.coords, ray.angle, 'horizontal');
        const {intersection: intersectionVertical, hitBlock: hitBlockVertical} = castRayUntilCollision(player.coords, ray.angle, 'vertical');

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
            magnitude = Math.sqrt( distVecHorizontal.x ** 2 + distVecHorizontal.y ** 2 );// should employ a better way to compute magnitude(using sin and cos of angle and x and y components since it is less costly than sqrt)
            horizontalCollision = true;
            hitBlock = hitBlockHorizontal ? (intersectionHorizontal.x % blockDimensions.x)/ blockDimensions.x : false;
        } else {
            finalIntersection = intersectionVertical;
            magnitude = Math.sqrt( distVecVertical.x ** 2 + distVecVertical.y ** 2 );// should employ a better way to compute magnitude(using sin and cos of angle and x and y components since it is less costly than sqrt)
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

const getBlockAtIntersection = (intersection: Coords, mainAxis: 'x' | 'y', isGoingAlongAxis: boolean) => {
    const blockRowIndex = Math.floor(intersection.y/blockDimensions.y) + ( mainAxis === 'y' && !isGoingAlongAxis ? -1 : 0 );
    const blockColIndex = Math.floor(intersection.x/blockDimensions.x) + (mainAxis === 'x' && !isGoingAlongAxis ? -1 : 0);
    // addDebuggerMessage(`checking if ray hits block at: (${blockColIndex}, ${blockRowIndex}) == ${BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex]}`);
    return BLOCKS_ARRAY[blockRowIndex]?.[blockColIndex];
}

const castRayUntilCollision = (startingPoint: Coords, orientationAngle: number, collisionType: 'vertical' | 'horizontal') => {
    const mainAxis = collisionType === 'vertical' ? 'x' : 'y';
    const crossAxis = mainAxis === 'x' ? 'y' : 'x';

    let isGoingAlongMainAxis: boolean;
    if(mainAxis === 'x') {
        isGoingAlongMainAxis = orientationAngle < Math.PI;
    } else {
        isGoingAlongMainAxis = orientationAngle > 3 * Math.PI/2 || orientationAngle < Math.PI/2;
    }

    let mainAxisDistanceToFirstBlock
    if(isGoingAlongMainAxis) {
        mainAxisDistanceToFirstBlock = blockDimensions[mainAxis] - (startingPoint[mainAxis] % blockDimensions[mainAxis])
    } else {
        mainAxisDistanceToFirstBlock = startingPoint[mainAxis] % blockDimensions[mainAxis]
    }

    const operationModifier = isGoingAlongMainAxis ? 1 : -1;
    const crossAxisRatio = crossAxis === 'x' ? Math.tan(orientationAngle) : 1/Math.tan(orientationAngle)
    const intersection = {
        [mainAxis]: startingPoint[mainAxis] + operationModifier * mainAxisDistanceToFirstBlock,
        [crossAxis]: startingPoint[crossAxis] + operationModifier * crossAxisRatio * mainAxisDistanceToFirstBlock,
    } as Coords;
    let correspondingBlockAtIntersection = getBlockAtIntersection(intersection, mainAxis, isGoingAlongMainAxis);

    const deltaMainAxis = operationModifier * blockDimensions[mainAxis];
    const deltaCrossAxis = operationModifier * crossAxisRatio * blockDimensions[mainAxis];
    while(Math.abs(intersection.x) < CANVAS_DIMENSIONS.x && Math.abs(intersection.y) < CANVAS_DIMENSIONS.y && !correspondingBlockAtIntersection) {
        intersection[mainAxis] += deltaMainAxis;
        intersection[crossAxis] += deltaCrossAxis;

        correspondingBlockAtIntersection = getBlockAtIntersection(intersection, mainAxis, isGoingAlongMainAxis);
    }


    return {
        intersection,
        hitBlock: !!correspondingBlockAtIntersection,
    };
}
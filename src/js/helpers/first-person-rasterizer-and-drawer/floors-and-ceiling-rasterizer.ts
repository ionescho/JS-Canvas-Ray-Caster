import { blockDimensions } from "../blocks";
import { CONFIG, configObservable } from "../config";
import { Coords } from "../drawer";
import { player } from "../player";
import { Ray, rays } from "../ray-caster";
import { addVec, scalarMulVec } from "../vectorOperations";
import { PixelMapType } from ".";
import { FIRST_PERSON_CANVAS_DIMENSIONS } from "./drawer";

let verticalPixelDistanceAlongRayFloorCorrespondent: number[][];// long name I know, this array associates each vertical pixel on each column(ray) with a distance along the ray's path from where we need to fetch the floor's color information that will be used to color that pixel.
const initVirtualProjectionPlanePixelRayDistanceMappingForFloors = () => {

    const verticalPixels = FIRST_PERSON_CANVAS_DIMENSIONS.y
    const halfFieldOfViewLength = CONFIG.HALF_FIELD_OF_VIEW_LENGTH
    const playerHeight = blockDimensions.z / 2
    verticalPixelDistanceAlongRayFloorCorrespondent = Array.from({ length: rays.length }, (v, i) => {
        const distanceFromObserverToVirtualPlaneVerticalPixelStrip = 1 / Math.cos((rays[i].angleFromOrientation));

        return Array.from({ length: Math.floor(verticalPixels / 2) }, (v, j) => {
            const currAngle =  Math.atan(halfFieldOfViewLength * ( 1 - 2 * j / verticalPixels ) / distanceFromObserverToVirtualPlaneVerticalPixelStrip);
            const distanceAlongRay = playerHeight / Math.tan(currAngle)
        
            return distanceAlongRay
        })
    })
}
setTimeout(() => {
    initVirtualProjectionPlanePixelRayDistanceMappingForFloors()
})
configObservable.registerListener(initVirtualProjectionPlanePixelRayDistanceMappingForFloors)


export const floorsAndCeilingsRasterizer = (ray: Ray, rayIndex: number, rayStripWidth: number, verticalPixelsLeftForFloor: number, pixelMap: PixelMapType) => {

    if(verticalPixelsLeftForFloor > 0 && CONFIG.drawFloors) {
        // draw floors start
        const rayAngleUnitVector: Coords = {
            x: Math.sin(ray.angle),
            y: Math.cos(ray.angle)
        }

        let currentPixelStripToDrawStart: number | null  = null;
        let currentPixelStripToDrawLength: number  = 0;
        verticalPixelDistanceAlongRayFloorCorrespondent[rayIndex].slice(0, verticalPixelsLeftForFloor).forEach((distance, pixelFromBottom) => {
            const pointOnTheFloorToDraw = addVec(player.coords, scalarMulVec(rayAngleUnitVector, distance));

            // below line just for testing purposes, just drawing a checkered floor with alternating white and black tiles to check if the perspective is correct, next step, implement textures
            const floorShouldDraw = Math.abs((Math.floor(pointOnTheFloorToDraw.x/ blockDimensions.x) + Math.floor(pointOnTheFloorToDraw.y/ blockDimensions.y)) % 2 ) === 1;

            if(floorShouldDraw) {
                if(currentPixelStripToDrawStart === null) {
                    currentPixelStripToDrawStart = pixelFromBottom;
                    currentPixelStripToDrawLength = 0;
                }
                currentPixelStripToDrawLength ++
            }   
                
            if( (!floorShouldDraw || pixelFromBottom === verticalPixelsLeftForFloor-1) && currentPixelStripToDrawStart !== null ) {

                
                // push floor vertical strip to pixel map, information later used for the actual drawing
                pixelMap.push({
                    startPixelPos: {
                        x: rayIndex * rayStripWidth,
                        y: FIRST_PERSON_CANVAS_DIMENSIONS.y - currentPixelStripToDrawStart - currentPixelStripToDrawLength
                    },
                    rectLength: {
                        x: rayStripWidth,
                        y: currentPixelStripToDrawLength
                    },
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                })
                // // push ceiling vertical strip to pixel map, information later used for the actual drawing
                pixelMap.push({
                    startPixelPos: {
                        x: rayIndex * rayStripWidth,
                        y: currentPixelStripToDrawStart
                    },
                    rectLength: {
                        x: rayStripWidth,
                        y: currentPixelStripToDrawLength
                    },
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                })

                currentPixelStripToDrawStart = null;
                currentPixelStripToDrawLength = 0;
            }
        })
    }
}
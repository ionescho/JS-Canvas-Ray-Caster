import { blockDimensions, wallTextures } from "./blocks";
import { CONFIG, configObservable } from "./config";
import { addDebuggerMessage } from "./debugger";
import { Coords } from "./drawer";
import { player } from "./player";
import { Ray, rays } from "./ray-caster";
import { addVec, scalarMulVec } from "./vectorOperations";

export const FIRST_PERSON_CANVAS_DIMENSIONS: Coords = {
    x: 500,
    y: 500,
};

let VIRTUAL_PROJECTION_PLANE_HEIGHT
let verticalPixelDistanceAlongRayFloorCorrespondent: number[][];// long name I know, this array associates each vertical pixel on each column with a distance along the ray's path from where we need to fetch the floor's color information that will be used to color that pixel.
const initVirtualProjectionPlanePixelRayDistanceMappingForFloors = () => {
    VIRTUAL_PROJECTION_PLANE_HEIGHT = 2 * Math.tan(CONFIG.HALF_FIELD_OF_VIEW);
    
    const horizontalPixels = FIRST_PERSON_CANVAS_DIMENSIONS.x
    const verticalPixels = FIRST_PERSON_CANVAS_DIMENSIONS.y
    const halfFieldOfViewLength = Math.tan(CONFIG.HALF_FIELD_OF_VIEW)
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

//canvas init
const canvas: HTMLCanvasElement = document.getElementById('firstPersonPerspective') as HTMLCanvasElement;
canvas.setAttribute('width', `${FIRST_PERSON_CANVAS_DIMENSIONS.x}px`);
canvas.setAttribute('height', `${FIRST_PERSON_CANVAS_DIMENSIONS.y}px`);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export const drawRaysAsWallsAndFloors = () => {
    ctx.reset();

    const rayStripWidth = FIRST_PERSON_CANVAS_DIMENSIONS.x / rays.length

    rays.forEach((ray: Ray, rayIndex) => {
        let verticalPixelsLeftForFloor: number = FIRST_PERSON_CANVAS_DIMENSIONS.y/2;
        if(ray.blockHitRelativePos) {
            // if ray hit a wall, we draw it
            let fishEyeCorrection = 1;
            if(CONFIG.applyFishEyeCorrection) {
                //apply cos of below angle for fisheye correction
                const angleBetweenRayAndPlayerOrientation = ray.angle - player.orientation.angle;
                fishEyeCorrection = Math.cos(angleBetweenRayAndPlayerOrientation);
            }
            
            const inverseDistance = 1 / (ray.magnitude * fishEyeCorrection );
            const projectedWallHeight = blockDimensions.z * inverseDistance; // the size of the wall on the projection plane
            const projectedWallRatio = projectedWallHeight / VIRTUAL_PROJECTION_PLANE_HEIGHT ; // the ratio between the plane-projected wall and the projection plane height
            const rayStripHeight = projectedWallRatio * FIRST_PERSON_CANVAS_DIMENSIONS.y; // regula de 3 simpla
            const wallStartY = FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - rayStripHeight/2;
    
            if(CONFIG.applyTextures) {
                const wallVerticalFragmentStripIndex = Math.floor(ray.blockHitRelativePos * wallTextures[0].length);
                const correspondingTextureStrip = wallTextures.map((textureRow) => textureRow[wallVerticalFragmentStripIndex]);
        
                // let finishedDrawingStrip = false;
                let coloredSubStripStart = 0;
                let coloredSubStripLength = 0;
                let texturedStripIndex = 0;
                while(texturedStripIndex <= correspondingTextureStrip.length + 1) {
                    if(correspondingTextureStrip[texturedStripIndex] === 1) {
                        coloredSubStripLength++;
                    } else {
                        if(correspondingTextureStrip[texturedStripIndex-1] && correspondingTextureStrip[texturedStripIndex-1] !== correspondingTextureStrip[texturedStripIndex]){
                            const subStripHeight = rayStripHeight * coloredSubStripLength / correspondingTextureStrip.length;
                            const subStripStart = rayStripHeight * coloredSubStripStart / correspondingTextureStrip.length;
        
                            ctx.beginPath();
                            ctx.rect(rayIndex * rayStripWidth, wallStartY + subStripStart, rayStripWidth, subStripHeight);
                            ctx.fillStyle = `rgba(0, 0, 0, 1)`;
                            ctx.fill();
                        }
                        coloredSubStripStart = texturedStripIndex + 1;
                        coloredSubStripLength = 0;
                    }
                    texturedStripIndex++
                }
            } else {
                // simple no textures
                ctx.beginPath();
                ctx.rect(rayIndex * rayStripWidth, wallStartY, rayStripWidth, rayStripHeight);
                ctx.fillStyle = `rgba(0, 0, 255, ${ray.horizontalCollision ? '1' : '0.7'})`;
                ctx.fill();
                // simple no textures end
            }
            //draw walls end

            verticalPixelsLeftForFloor = wallStartY

        }

        if(verticalPixelsLeftForFloor > 0 && CONFIG.drawFloors) {
            //draw floors start
            ctx.beginPath();
            const rayAngleUnitVector: Coords = {
                x: Math.sin(ray.angle),
                y: Math.cos(ray.angle)
            }

            verticalPixelDistanceAlongRayFloorCorrespondent[rayIndex].slice(0, verticalPixelsLeftForFloor).forEach((distance, pixelFromBottom) => {
                const pointOnTheFloorToDraw = addVec(player.coords, scalarMulVec(rayAngleUnitVector, distance));

                //below line just for testing purposes, we will try to draw a checkered floor with alternating white and black tiles
                const floorShouldDraw = Math.abs((Math.floor(pointOnTheFloorToDraw.x/ blockDimensions.x) + Math.floor(pointOnTheFloorToDraw.y/ blockDimensions.y)) % 2 ) === 1;

                if(floorShouldDraw) {
                    ctx.rect(rayIndex * rayStripWidth, FIRST_PERSON_CANVAS_DIMENSIONS.y - pixelFromBottom, rayStripWidth, 1);
                    ctx.rect(rayIndex * rayStripWidth, pixelFromBottom, rayStripWidth, 1);
                }
            })
            ctx.fillStyle = `rgba(0, 0, 0, 1)`;
            ctx.fill();
            //draw floors end
        }


        // addDebuggerMessage(`Strip ${rayIndex} -> magnitude: ${ray.magnitude}`);
        // addDebuggerMessage(`Strip ${rayIndex} -> inverse coords sum: ${inverseDistance}`);
        // addDebuggerMessage(`Strip ${rayIndex} rect -> x:${rayIndex * rayStripWidth}, y:${FIRST_PERSON_CANVAS_DIMENSIONS.y - rayStripHeight}, w:${rayStripWidth}, h: ${rayStripHeight}`);
    })
}
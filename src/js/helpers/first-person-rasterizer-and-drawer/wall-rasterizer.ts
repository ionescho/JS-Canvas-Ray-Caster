import { blockDimensions, wallTextures } from "../blocks";
import { CONFIG } from "../config";
import { player } from "../player";
import { Ray } from "../ray-caster";
import { PixelMapType } from ".";
import { FIRST_PERSON_CANVAS_DIMENSIONS } from "./drawer";


export const wallRasterizer = (ray: Ray, rayIndex: number, rayStripWidth: number, virtualProjectionPlaneHeight: number, pixelMap: PixelMapType) => {

        let verticalPixelsLeftForFloor: number = FIRST_PERSON_CANVAS_DIMENSIONS.y/2;
        if(ray.blockHitRelativePos) {
            // if ray hit a wall, we draw it
            let fishEyeCorrection = 1;
            if(CONFIG.applyFishEyeCorrection) {
                // apply cos of below angle for fisheye correction
                const angleBetweenRayAndPlayerOrientation = ray.angle - player.orientation.angle;
                fishEyeCorrection = Math.cos(angleBetweenRayAndPlayerOrientation);
            }
            
            const inverseDistance = 1 / (ray.magnitude * fishEyeCorrection );
            const projectedWallHeight = blockDimensions.z * inverseDistance; // the size of the wall on the projection plane
            const projectedWallRatio = projectedWallHeight / virtualProjectionPlaneHeight ; // the ratio between the plane-projected wall and the projection plane height
            
            const rayStripHeight = projectedWallRatio * FIRST_PERSON_CANVAS_DIMENSIONS.y; // regula de 3 simpla
            const wallStartY = FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - rayStripHeight/2;
    
            if(CONFIG.applyTextures) {
                const wallVerticalTextureFragmentStripIndex = Math.floor(ray.blockHitRelativePos * wallTextures[0].length);
                const correspondingTextureStrip = wallTextures.map((textureRow) => textureRow[wallVerticalTextureFragmentStripIndex]);

                let coloredSubStripStart = 0;
                let coloredSubStripLength = 0;
                let texturedStripIndex = 0;
                while(texturedStripIndex <= correspondingTextureStrip.length + 1) {
                    
                    if(texturedStripIndex === 0 || correspondingTextureStrip[texturedStripIndex] === correspondingTextureStrip[texturedStripIndex-1]) {
                        coloredSubStripLength++;
                    } else {
                        const color = correspondingTextureStrip[texturedStripIndex-1];
                        let r,g,b,a: number;
                        if(color) {
                            r = g = b = 0;
                        } else {
                            r = g = b = 255;
                        }
                        a = 1;

                        const subStripHeight = rayStripHeight * coloredSubStripLength / correspondingTextureStrip.length;
                        const subStripStart = rayStripHeight * coloredSubStripStart / correspondingTextureStrip.length;

                        // adding pixel info to the pixel map so it can be drawn later
                        pixelMap.push({
                            startPixelPos: {
                                x: rayIndex * rayStripWidth,
                                y: wallStartY + subStripStart
                            },
                            rectLength: {
                                x: rayStripWidth,
                                y: subStripHeight
                            },
                            r,
                            g,
                            b,
                            a,
                            distance: ray.magnitude
                        })


                        coloredSubStripStart = texturedStripIndex;
                        coloredSubStripLength = 1;
                    }
                    texturedStripIndex++
                }
            } else {
                // simple no textures
                pixelMap.push({
                    startPixelPos: {
                        x: rayIndex * rayStripWidth,
                        y: wallStartY
                    },                    
                    rectLength: {
                        x: rayStripWidth,
                        y: rayStripHeight
                    },
                    r: 0,
                    g: 0,
                    b: 255,
                    a: ray.horizontalCollision ? 1 : 0.7,
                    distance: ray.magnitude
                })
            }
            //draw walls end

            verticalPixelsLeftForFloor = Math.round(wallStartY)

        }

        return verticalPixelsLeftForFloor;
}
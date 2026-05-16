import { blockDimensions, wallTextures } from "../blocks";
import { CONFIG } from "../config";
import { player } from "../player";
import { Ray } from "../ray-caster";
import { PixelMapType } from ".";
import { FIRST_PERSON_CANVAS_DIMENSIONS } from "./drawer";

const convertVerticalTextureArrayStripToPixelMap = (rayIndex: number, rayStripWidth: number, wallStripPixelHeight: number, correspondingTextureStrip: number[], pixelMap: PixelMapType, distance: number) => {
    const wallStartY = FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - wallStripPixelHeight/2;

    let coloredSubStripStart = 0;
    let coloredSubStripLength = 0;
    let texturedStripIndex = 0;
    while(texturedStripIndex <= correspondingTextureStrip.length + 1) {
        
        if(texturedStripIndex === 0 || correspondingTextureStrip[texturedStripIndex] === correspondingTextureStrip[texturedStripIndex-1]) {
            coloredSubStripLength++;
        } else {
            const colorInfo: number | number[] = correspondingTextureStrip[texturedStripIndex-1];
            let r,g,b,a: number;
            if(Array.isArray(colorInfo)) {
                [r, g, b] = colorInfo;
            } else {
                r = g = b = colorInfo;
            }
            a = 1;

            const subStripHeight = wallStripPixelHeight * coloredSubStripLength / correspondingTextureStrip.length;
            const subStripStart = wallStripPixelHeight * coloredSubStripStart / correspondingTextureStrip.length;

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
                distance,
            })


            coloredSubStripStart = texturedStripIndex;
            coloredSubStripLength = 1;
        }
        texturedStripIndex++
    }

};

const convertVerticalTextureBitmapStripToPixelMap = (rayIndex: number, rayStripWidth: number, wallStripPixelHeight: number, correspondingTextureStrip: ImageBitmap, pixelMap: PixelMapType, distance: number) => {
    const wallStartY = FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - wallStripPixelHeight/2;

        pixelMap.push({
            startPixelPos: {
                x: rayIndex * rayStripWidth,
                y: wallStartY
            },
            rectLength: {
                x: rayStripWidth,
                y: wallStripPixelHeight
            },
            bitmap: correspondingTextureStrip,
            distance,
        });
};

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
            const projectedWallStripHeight = blockDimensions.z * inverseDistance; // the size of the wall on the projection plane
            const projectedWallStripRatio = projectedWallStripHeight / virtualProjectionPlaneHeight ; // the ratio between the plane-projected wall and the projection plane height
            
            const wallStripPixelHeight = projectedWallStripRatio * FIRST_PERSON_CANVAS_DIMENSIONS.y; // regula de 3 simpla
            const wallStartY = FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - wallStripPixelHeight/2;

            if(CONFIG.applyTextures) {
                const correspondingTexture = wallTextures[ray.blockTexture as number - 1];
                if(correspondingTexture[0] instanceof Array) {
                    const wallVerticalTextureFragmentStripIndex = Math.floor(ray.blockHitRelativePos * correspondingTexture[0].length);
                    const correspondingTextureStrip = correspondingTexture.map((textureRow) => textureRow[wallVerticalTextureFragmentStripIndex]);
    
                    convertVerticalTextureArrayStripToPixelMap(rayIndex, rayStripWidth, wallStripPixelHeight, correspondingTextureStrip, pixelMap, ray.magnitude);
                } else {
                    // Handle single ImageBitmap case
                    const wallVerticalTextureFragmentStripIndex = Math.floor(ray.blockHitRelativePos * correspondingTexture.length);
                    const correspondingTextureStrip = correspondingTexture[wallVerticalTextureFragmentStripIndex] as ImageBitmap;
                    convertVerticalTextureBitmapStripToPixelMap(rayIndex, rayStripWidth, wallStripPixelHeight, correspondingTextureStrip, pixelMap, ray.magnitude);
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
                        y: wallStripPixelHeight
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
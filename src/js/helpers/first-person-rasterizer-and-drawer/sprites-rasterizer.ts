import { PixelMapType } from ".";
import { CONFIG } from "../config";
import { addDebuggerMessage, roundDec2 } from "../debugger";
import { CANVAS_DIMENSIONS, Coords, drawLine, drawRect } from "../drawer";
import { player } from "../player";
import { SPRITES } from "../sprites"
import { addVec, perpendicularVector, scalarMulVec, subVec, unitVector, vectorMagnitude } from "../vectorOperations";
import { FIRST_PERSON_CANVAS_DIMENSIONS } from "./drawer";

export const spritesRasterizer = (pixelMap: PixelMapType) => {
    SPRITES.forEach((sprite, index) => {
        const isInView = isSpriteInFOV(sprite);
        addDebuggerMessage(`Is sprite ${index} in FOV: ${isInView ? 'YES' : 'NO'}`);

        if(isInView) {
            // The below formula seems complicated but this is what I ended up with after calculating the intersection formula of 2 functions that are mapped to the orientation vector of the player and to the perpendicular plane of the sprite
            const xIntersection = (sprite.pos.y - player.coords.y + player.orientation.unitVector.y * player.coords.x / player.orientation.unitVector.x + player.orientation.unitVector.x * sprite.pos.x / player.orientation.unitVector.y) / ( player.orientation.unitVector.y / player.orientation.unitVector.x + player.orientation.unitVector.x / player.orientation.unitVector.y )
            const orientationWithSpritePlaneIntersection: Coords = {
                x: xIntersection,
                y: player.orientation.unitVector.y / player.orientation.unitVector.x * (xIntersection - player.coords.x) + player.coords.y
            }

            const playerToSpritePlaneVector = subVec(orientationWithSpritePlaneIntersection, player.coords);
            const distanceFromPlayerToSpritePlane = vectorMagnitude(playerToSpritePlaneVector);
            const spritePlaneIntersectionToSpriteVector = subVec(sprite.pos, orientationWithSpritePlaneIntersection);
            const distanceFromSpriteToIntersectionWithPlayerOrientation = vectorMagnitude(spritePlaneIntersectionToSpriteVector);

            const isSpriteToTheLeft = playerToSpritePlaneVector.x * spritePlaneIntersectionToSpriteVector.y - playerToSpritePlaneVector.y * spritePlaneIntersectionToSpriteVector.x < 0
            const distanceFromSpriteProjectionOnVirtualScreenToCenter = distanceFromSpriteToIntersectionWithPlayerOrientation / distanceFromPlayerToSpritePlane;
            const screenPlaneHalfWidth = CONFIG.HALF_FIELD_OF_VIEW_LENGTH;

            const leftToSpriteVirtualScreenDistance = screenPlaneHalfWidth + (isSpriteToTheLeft ? -1 : 1) * distanceFromSpriteProjectionOnVirtualScreenToCenter;
            const spriteWidthOnVirtualScreen = sprite.width / distanceFromPlayerToSpritePlane;

            const leftToSpriteStartOnVirtualScreen = leftToSpriteVirtualScreenDistance - spriteWidthOnVirtualScreen / 2;
            const leftToSpriteEndOnVirtualScreen = leftToSpriteStartOnVirtualScreen + spriteWidthOnVirtualScreen;

            const pixelsFromLeftToSpriteStart = leftToSpriteStartOnVirtualScreen / (screenPlaneHalfWidth * 2) * FIRST_PERSON_CANVAS_DIMENSIONS.x
            const pixelsFromLeftToSpriteEnd = leftToSpriteEndOnVirtualScreen / (screenPlaneHalfWidth * 2) * FIRST_PERSON_CANVAS_DIMENSIONS.x


            // const distanceFromSpriteStartToIntersectionWithPlayerOrientation = vectorMagnitude(subVec(orientationWithSpritePlaneIntersection, sprite.pos)) - sprite.width / 2;
            // const distanceFromSpriteEndToIntersectionWithPlayerOrientation = distanceFromSpriteStartToIntersectionWithPlayerOrientation + sprite.width;

            // const distanceFromFPViewOriginToSpriteStart = distanceFromSpriteStartToIntersectionWithPlayerOrientation / distanceFromPlayerToSpritePlane;
            // const distanceFromFPViewOriginToSpriteEnd = distanceFromSpriteEndToIntersectionWithPlayerOrientation / distanceFromPlayerToSpritePlane;

            // const screenPlaneHalfWidth = CONFIG.HALF_FIELD_OF_VIEW_LENGTH;

            // const distanceFromFPViewLeftToSpriteStart = screenPlaneHalfWidth - distanceFromFPViewOriginToSpriteStart;
            // const distanceFromFPViewLeftToSpriteEnd = screenPlaneHalfWidth - distanceFromFPViewOriginToSpriteEnd;

            // const pixelsFromLeftToSpriteStart = distanceFromFPViewLeftToSpriteStart / (screenPlaneHalfWidth * 2) * FIRST_PERSON_CANVAS_DIMENSIONS.x
            // const pixelsFromLeftToSpriteEnd = distanceFromFPViewLeftToSpriteEnd / (screenPlaneHalfWidth * 2) * FIRST_PERSON_CANVAS_DIMENSIONS.x

            if(pixelsFromLeftToSpriteStart >= 0) {
                pixelMap.push({
                    startPixelPos: {
                        x: pixelsFromLeftToSpriteStart,
                        y: CANVAS_DIMENSIONS.y /2
                    },
                    rectLength: {
                        x: 15,
                        y: 15
                    },
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                })
            }
            if(pixelsFromLeftToSpriteEnd <= CANVAS_DIMENSIONS.x) {
                pixelMap.push({
                    startPixelPos: {
                        x: pixelsFromLeftToSpriteEnd,
                        y: CANVAS_DIMENSIONS.y /2
                    },
                    rectLength: {
                        x: 15,
                        y: 15
                    },
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                })
            }
            
            drawLine(orientationWithSpritePlaneIntersection, player.coords, 3, 'blue')
        }
    });
}

const isSpriteInFOV = ({pos, width}: {pos: Coords, width: number}) => {    
    // this piece of code below is duplicated from drawer -> drawSprites, should be called only once in a pre-processor or smth
    const spritePlaneUnitVector = perpendicularVector(player.orientation.unitVector);
    const spriteHalfVector = scalarMulVec(spritePlaneUnitVector, width / 2);

    const spriteStart = addVec(pos, spriteHalfVector);
    const spriteEnd = subVec(pos, spriteHalfVector);
    //duplicate code end

    const angleSpriteStart: number = getAngleOfCoordinatesRelativeToPlayer(spriteStart);
    const angleSpriteEnd: number = getAngleOfCoordinatesRelativeToPlayer(spriteEnd);

    const [normalizedSpriteStartAngle, normalizedSpriteEndAngle, normalizedPlayerOrientationAngle] = normalizeSpriteAndPlayerOrientationAngles(angleSpriteStart, angleSpriteEnd, player.orientation.angle)
    
    // addDebuggerMessage(`Angle of line from player to sprite start: ${ roundDec2(180 * normalizedSpriteStartAngle / Math.PI)} deg`)
    // addDebuggerMessage(`Angle of line from player to sprite end: ${ roundDec2(180 * normalizedSpriteEndAngle / Math.PI)} deg`)

    const playerFOVStartAngle = normalizedPlayerOrientationAngle - CONFIG.HALF_FIELD_OF_VIEW_ANGLE
    const playerFOVEndAngle = normalizedPlayerOrientationAngle + CONFIG.HALF_FIELD_OF_VIEW_ANGLE
    // addDebuggerMessage(`Normalized Orientation Start FOV Angle: ${ roundDec2(180 * playerFOVStartAngle / Math.PI)} deg`)
    // addDebuggerMessage(`Normalized Orientation End FOV Angle: ${ roundDec2(180 * playerFOVEndAngle / Math.PI)} deg`)

    let isInView = (normalizedSpriteStartAngle > playerFOVStartAngle && normalizedSpriteStartAngle < playerFOVEndAngle)
                     || (normalizedSpriteEndAngle > playerFOVStartAngle && normalizedSpriteEndAngle < playerFOVEndAngle)
                     || (normalizedSpriteStartAngle < playerFOVStartAngle && normalizedSpriteEndAngle > playerFOVEndAngle)

    

    drawLine(spriteStart, player.coords, isInView ? 3: undefined, isInView ? 'yellow': undefined)
    drawLine(spriteEnd, player.coords, isInView ? 3: undefined, isInView ? 'yellow': undefined)

    return isInView;
}

const getAngleOfCoordinatesRelativeToPlayer = (pos: Coords) => {
    const playerToPosVector = subVec(pos, player.coords);
    const distanceFromPlayerToPos = vectorMagnitude(playerToPosVector);
    // addDebuggerMessage(`Distance from player to sprite: ${roundDec2(distanceFromPlayerToPos)} (X: ${roundDec2(playerToPosVector.x)}, Y: ${roundDec2(playerToPosVector.y)})`)
    const angleBetweenPlayerToPosLineAndVerticalAxis = Math.abs(Math.asin(playerToPosVector.x / distanceFromPlayerToPos));
    // addDebuggerMessage(`Arcsin: ${roundDec2(180 * angleBetweenPlayerToPosLineAndVerticalAxis / Math.PI) } deg`)

    let playerToPosRelativeAngleOrientation: number;
    const playerMapPosHigher = player.coords.y < pos.y;
    const playerMapPosMoreLeft = player.coords.x < pos.x;
    if(playerMapPosHigher) {
        // up
        if(playerMapPosMoreLeft) {
            // left
            playerToPosRelativeAngleOrientation = angleBetweenPlayerToPosLineAndVerticalAxis;
        } else {
            // right
            playerToPosRelativeAngleOrientation = 2 * Math.PI - angleBetweenPlayerToPosLineAndVerticalAxis;
        }
    } else {
        // down
        if(playerMapPosMoreLeft) {
            // left
            playerToPosRelativeAngleOrientation = Math.PI - angleBetweenPlayerToPosLineAndVerticalAxis;
        } else {
            // right
            playerToPosRelativeAngleOrientation = Math.PI + angleBetweenPlayerToPosLineAndVerticalAxis;
        }
    }

    return playerToPosRelativeAngleOrientation;
}

// to avoid situations where the angles are close to 360 (from above or below) where the angle actually resets to zero and the comparison would be pointless because they wouldn't overlap, we must normalize the angles ( the angles just above zero need to have 360 degrees added to them in order to be relevant for comparison)
const normalizeSpriteAndPlayerOrientationAngles = (spriteStartAngle: number, spriteEndAngle: number, playerOrientationAngle: number) => {
    const justBelow360 = Math.PI * 2 - CONFIG.HALF_FIELD_OF_VIEW_ANGLE;
    const justAbove360 = Math.PI * 2 - CONFIG.HALF_FIELD_OF_VIEW_ANGLE;
    let normalizedSpriteStartAngle = spriteStartAngle;
    let normalizedSpriteEndAngle = spriteEndAngle;
    let normalizedPlayerOrientationAngle = playerOrientationAngle;
    if(
        (spriteStartAngle > justBelow360 || spriteEndAngle > justBelow360 || playerOrientationAngle > justBelow360)
        && (spriteStartAngle < justAbove360 || spriteEndAngle < justAbove360 || playerOrientationAngle < justAbove360 )
    ) {
        if (spriteStartAngle < justAbove360) {
            normalizedSpriteStartAngle += Math.PI * 2
        }
        if (spriteEndAngle < justAbove360) {
            normalizedSpriteEndAngle += Math.PI * 2
        }
        if (playerOrientationAngle < justAbove360) {
            normalizedPlayerOrientationAngle += Math.PI * 2
        }
    }

    return [normalizedSpriteStartAngle, normalizedSpriteEndAngle, normalizedPlayerOrientationAngle];
}



/**
 * 
 * 
 * FAIL
        const playerToSpriteVector = subVec(sprite.pos, player.coords);
        drawLine(sprite.pos, player.coords)
        const distanceFromPlayerToSprite = vectorMagnitude(playerToSpriteVector);
        addDebuggerMessage(`Distance from player to sprite: ${roundDec2(distanceFromPlayerToSprite)} (X: ${roundDec2(playerToSpriteVector.x)}, Y: ${roundDec2(playerToSpriteVector.y)})`)
        const angleBetweenPlayerToSpriteLineAndVerticalAxis = (playerToSpriteVector.x > 0 ? 1 : -1) * (playerToSpriteVector.y < 0 ? Math.PI : 0) - (playerToSpriteVector.y > 0 ? -1 : 1) * Math.asin(playerToSpriteVector.x / distanceFromPlayerToSprite);
        addDebuggerMessage(`angle sprite-player-OY: ${roundDec2(180 * angleBetweenPlayerToSpriteLineAndVerticalAxis / Math.PI) } deg`)
        
        const angleBetweenOrientationAndOY = player.orientation.angle > Math.PI ? player.orientation.angle - Math.PI * 2 : player.orientation.angle
        addDebuggerMessage(`angle orientation-OY: ${roundDec2(180 * angleBetweenOrientationAndOY / Math.PI) } deg`)

        const angleBetweenPlayerToSpriteLineAndPlayerOrientation = angleBetweenPlayerToSpriteLineAndVerticalAxis - angleBetweenOrientationAndOY;
        addDebuggerMessage(`angle sprite-player-orientation: ${roundDec2(180 * angleBetweenPlayerToSpriteLineAndPlayerOrientation / Math.PI) } deg`)



        const isInView = angleBetweenPlayerToSpriteLineAndPlayerOrientation <= CONFIG.HALF_FIELD_OF_VIEW_ANGLE &&  angleBetweenPlayerToSpriteLineAndPlayerOrientation >= -CONFIG.HALF_FIELD_OF_VIEW_ANGLE;

        addDebuggerMessage(`Is in FOV: ${isInView ? 'YES' : 'NO'}`)
 */
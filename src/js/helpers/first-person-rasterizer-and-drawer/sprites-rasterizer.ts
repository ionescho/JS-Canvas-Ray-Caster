import { CONFIG } from "../config";
import { addDebuggerMessage, roundDec2 } from "../debugger";
import { Coords, drawLine } from "../drawer";
import { player } from "../player";
import { rays } from "../ray-caster";
import { SPRITES } from "../sprites"
import { addVec, perpendicularVector, scalarMulVec, subVec, unitVector, vectorMagnitude } from "../vectorOperations";

export const spritesRasterizer = () => {
    SPRITES.forEach((sprite, index) => {
        const isInView = isSpriteInFOV(sprite);
        addDebuggerMessage(`Is in FOV: ${isInView ? 'YES' : 'NO'}`);


    });
}

const isSpriteInFOV = ({pos, width}: {pos: Coords, width: number}) => {    
    // this piece of code below is duplicated from drawer -> drawSprites, should be called only once in a pre-processor or smth
    const playerToSpriteVector = subVec(pos, player.coords);
    const spritePlaneUnitVector = unitVector(perpendicularVector(playerToSpriteVector));
    const spriteHalfVector = scalarMulVec(spritePlaneUnitVector, width / 2);

    const spriteStart = addVec(pos, spriteHalfVector);
    const spriteEnd = subVec(pos, spriteHalfVector);
    //duplicate code end

    drawLine(spriteStart, player.coords)
    drawLine(spriteEnd, player.coords)

    const angleSpriteStart: number = getAngleOfCoordinatesRelativeToPlayer(spriteStart);
    const angleSpriteEnd = getAngleOfCoordinatesRelativeToPlayer(spriteEnd);

    const [normalizedSpriteStartAngle, normalizedSpriteEndAngle, normalizedPlayerOrientationAngle] = normalizeSpriteAndPlayerOrientationAngles(angleSpriteStart, angleSpriteEnd, player.orientation.angle)
    
    addDebuggerMessage(`Angle of line from player to sprite start: ${ roundDec2(180 * normalizedSpriteStartAngle / Math.PI)} deg`)
    addDebuggerMessage(`Angle of line from player to sprite end: ${ roundDec2(180 * normalizedSpriteEndAngle / Math.PI)} deg`)

    const playerFOVStartAngle = normalizedPlayerOrientationAngle - CONFIG.HALF_FIELD_OF_VIEW
    const playerFOVEndAngle = normalizedPlayerOrientationAngle + CONFIG.HALF_FIELD_OF_VIEW
    addDebuggerMessage(`Normalized Orientation Start FOV Angle: ${ roundDec2(180 * playerFOVStartAngle / Math.PI)} deg`)
    addDebuggerMessage(`Normalized Orientation End FOV Angle: ${ roundDec2(180 * playerFOVEndAngle / Math.PI)} deg`)

    let isInView = (normalizedSpriteStartAngle > playerFOVStartAngle && normalizedSpriteStartAngle < playerFOVEndAngle)
                     || (normalizedSpriteEndAngle > playerFOVStartAngle && normalizedSpriteEndAngle < playerFOVEndAngle)
                     || (normalizedSpriteStartAngle < playerFOVStartAngle && normalizedSpriteEndAngle > playerFOVEndAngle)

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

// to avoid situations where the angles are close to 360 (from above or below) where the angle actually resets to zero and the comparison would be pointless because they wouldn't overlap, we must normalize the angles ( the angles above zero need to have 360 degrees added to them in order to be relevant for comparison)
const normalizeSpriteAndPlayerOrientationAngles = (spriteStartAngle: number, spriteEndAngle: number, playerOrientationAngle: number) => {
    const justBelow360 = Math.PI * 2 - CONFIG.HALF_FIELD_OF_VIEW;
    const justAbove360 = Math.PI * 2 - CONFIG.HALF_FIELD_OF_VIEW;
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



        const isInView = angleBetweenPlayerToSpriteLineAndPlayerOrientation <= CONFIG.HALF_FIELD_OF_VIEW &&  angleBetweenPlayerToSpriteLineAndPlayerOrientation >= -CONFIG.HALF_FIELD_OF_VIEW;

        addDebuggerMessage(`Is in FOV: ${isInView ? 'YES' : 'NO'}`)
 */
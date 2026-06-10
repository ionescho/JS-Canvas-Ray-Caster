import { resolvePotentialCollisions } from "./collision-resolvers";
import { CONFIG } from "./config";
import { movementKeysPressed } from "./eventListeners";
import { player } from "./player";
import { addVec, scalarMulVec } from "./vectorOperations";

export const updateOrientation = () => {
    if(movementKeysPressed.left || movementKeysPressed.right) {
        const playerOrientationDelta = player.orientation.speed/CONFIG.FPS
        
        //update orientation
        player.orientation.angle = player.orientation.angle + playerOrientationDelta * (movementKeysPressed.left ? -1 : 1);

        // if orientation angle larger than 2PI or smaller than 0, force it back in the interval
        if(player.orientation.angle > 2 * Math.PI) {
            player.orientation.angle -= 2 * Math.PI;
        }
        if((player.orientation.angle < 0)) {
            player.orientation.angle += 2 * Math.PI;
        }

        player.orientation.unitVector = {
            x: Math.cos(player.orientation.angle),
            y: Math.sin(player.orientation.angle)
        }
    }
}

export const updatePosition = () => {

    if(movementKeysPressed.up || movementKeysPressed.down || movementKeysPressed.strafeLeft || movementKeysPressed.strafeRight) {

        let movementDirection = player.orientation.angle
        if(movementKeysPressed.down) {
            movementDirection = player.orientation.angle + Math.PI
        } else if(movementKeysPressed.strafeLeft) {
            movementDirection = player.orientation.angle - Math.PI / 2
        } else if(movementKeysPressed.strafeRight) {
            movementDirection = player.orientation.angle + Math.PI / 2
        }
        // update direction vector(used to transform direction angle into actionable position change x and y)
        player.movement.speedVector.x = Math.cos(movementDirection) * player.speed;
        player.movement.speedVector.y = Math.sin(movementDirection) * player.speed;

        const potentialFuturePlayerPos = addVec(player.coords, scalarMulVec(player.movement.speedVector, 1/CONFIG.FPS))
        
        player.coords = resolvePotentialCollisions(potentialFuturePlayerPos);
    }
}
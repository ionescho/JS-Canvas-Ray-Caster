import { FPS } from "../main";
import { resolvePotentialCollisions } from "./collision-resolvers";
import { movementKeysPressed } from "./eventListeners";
import { player } from "./player";
import { addVec, scalarMulVec } from "./vectorOperations";

export const updateOrientation = () => {
    if(movementKeysPressed.left || movementKeysPressed.right) {
        const playerOrientationDelta = player.orientation.speed/FPS
        
        //update orientation
        player.orientation.angle = player.orientation.angle + playerOrientationDelta * (movementKeysPressed.left ? -1 : 1);

        // if orientation angle larger than 2PI or smaller than 0, do a normalization(hope this is the correct wording)
        if((player.orientation.angle > 2 * Math.PI) || (player.orientation.angle < 0)) {
            player.orientation.angle = (player.orientation.angle + 2 * Math.PI) % (2 * Math.PI);
        }
    }
}

export const updatePosition = () => {

    if(movementKeysPressed.up || movementKeysPressed.down) {

        let movementDirection = player.orientation.angle
        if(movementKeysPressed.down) {
            movementDirection = player.orientation.angle + Math.PI
        }
        // update direction vector(used to transform direction angle into actionable position change x and y)
        player.movement.speedVector.x = Math.sin(movementDirection) * player.speed;
        player.movement.speedVector.y = Math.cos(movementDirection) * player.speed;

        const potentialFuturePlayerPos = addVec(player.coords, scalarMulVec(player.movement.speedVector, 1/FPS))
        
        player.coords = resolvePotentialCollisions(potentialFuturePlayerPos);
    }
}
import { blockDimensions } from "./blocks";
import { Coords } from "./drawer";

type Player = {
    coords: Coords;
    speed: number;
    orientation: {
        angle: number;
        speed: number;
        unitVector: Coords;
    };
    movement: {
        speedVector: Coords
    };
    getSector: () => Coords;
}

export const PLAYER_SQUARE_SIZE: Coords = {
    x: 20,
    y: 20,
}

export const player: Player = {
    coords: { x: 250, y: 250 }, // player x, y coordinates
    speed: 50, // fixed player speed potential in pixels per second( assuming no obstructions ),
    orientation: {
        angle: 0, //orientation angle in radians
        speed: 2, // the speed with which the player changes it's orientation angle( when pressing left or right )
        unitVector: {
            x: 0,
            y: 1
        }
    },
    movement: {
        speedVector: {// translates the movement direction angle and speed into a speed vector used to calculate position changes for the x and y components
            x: 0,
            y: 0
        }
    },
    getSector: () => ({
        x: Math.floor(player.coords.x / blockDimensions.x),
        y: Math.floor(player.coords.y / blockDimensions.y)
    })
}
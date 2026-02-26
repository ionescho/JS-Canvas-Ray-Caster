import { blockDimensions } from "./blocks";
import { CANVAS_DIMENSIONS, Coords } from "./drawer";

type Player = {
    coords: Coords;
    speed: number;
    orientation: {
        angle: number;
        speed: number;
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
    coords: { x: 50, y: 50 }, // player x, y coordinates
    speed: 100, // fixed player speed potential in pixels per second( assuming no obstructions ),
    orientation: {
        angle: 0, //orientation angle in radians
        speed: 2, // the speed with which the player changes it's orientation angle( when pressing left or right )
    },
    movement: {
        speedVector: {// translates the movement direction angle and speed into a speed vector used to calculate position changes for the x and y components
            x: 0,
            y: 0
        }
    },
    getSector: () => ({
        x: Math.floor((player.coords.x + CANVAS_DIMENSIONS.x/2) / blockDimensions.x),
        y: Math.floor((- player.coords.y + CANVAS_DIMENSIONS.y/2) / blockDimensions.y)
    })
}
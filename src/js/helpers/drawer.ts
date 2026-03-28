import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { player, PLAYER_SQUARE_SIZE } from "./player";
import { Ray, rays } from "./ray-caster";
import { SPRITES } from "./sprites";
import { addVec, perpendicularVector, scalarMulVec, subVec, unitVector } from "./vectorOperations";

export const CANVAS_DIMENSIONS: Coords = {
    x: 500,
    y: 500,
};

export type Coords = {
    x: number;
    y: number
};

const canvas: HTMLCanvasElement = document.getElementById('rayCaster') as HTMLCanvasElement;
canvas.setAttribute('width', `${CANVAS_DIMENSIONS.x}px`);
canvas.setAttribute('height', `${CANVAS_DIMENSIONS.y}px`);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export const emptyCanvas = () => ctx.reset();

export const drawRect = (coords: Coords, size: Coords, color?: string) => {
    ctx.beginPath();
    ctx.rect(coords.x, coords.y, size.x, size.y);
    if(color) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.fillStyle = 'black';
        ctx.stroke();
    }
}

export const drawCircle = (coords: Coords, radius: number, color?: string) => {
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color || 'yellow';
    ctx.fill();
}

export const drawLine = (start: Coords, end: Coords, lineWidth: number = 1, color: string = 'black') => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

export const drawBlocks = () => {
    //draw blocks
    BLOCKS_ARRAY.forEach((row, i) => row.forEach((block, j) => {
        if(block >= 1) {
            // draw block at i j
            drawRect({
                x: j * blockDimensions.x,
                y: i * blockDimensions.y
            }, blockDimensions);
        }
    }))

}

export const drawPlayer = () => {
    //draw player square
    const playerSquareTopLeft = addVec(player.coords, scalarMulVec(PLAYER_SQUARE_SIZE, -1/2));
    drawRect(playerSquareTopLeft, PLAYER_SQUARE_SIZE, 'blue');
    //draw player orientation
    drawLine(player.coords, addVec(player.coords, scalarMulVec(player.orientation.unitVector, 20)));

}

export const drawRays = () => {
    rays.forEach(({ end }: Ray) => {
        drawLine(player.coords, end, 2, 'red');
    })
}

export const drawSprites = () => {
    SPRITES.forEach(({ pos, width }) => {
        const spritePlaneUnitVector = perpendicularVector(player.orientation.unitVector);
        const spriteHalfVector = scalarMulVec(spritePlaneUnitVector, width / 2);

        const spriteLineStart = addVec(pos, spriteHalfVector);
        const spriteLineEnd = subVec(pos, spriteHalfVector);

        drawLine(spriteLineStart, spriteLineEnd);
    })
}
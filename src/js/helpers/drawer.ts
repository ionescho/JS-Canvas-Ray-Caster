import { blockDimensions, BLOCKS_ARRAY } from "./blocks";
import { player, PLAYER_SQUARE_SIZE } from "./player";
import { Ray, rays } from "./ray-caster";
import { addToCanvasPos, addVec, scalarMulVec } from "./vectorOperations";

export const CANVAS_DIMENSIONS: Coords = {
    x: 500,
    y: 500,
};

export const SCREEN_END: Coords = scalarMulVec( CANVAS_DIMENSIONS, 1/2)

export type Coords = {
    x: number;
    y: number
};

const canvas: HTMLCanvasElement = document.getElementById('rayCaster') as HTMLCanvasElement;
canvas.setAttribute('width', `${CANVAS_DIMENSIONS.x}px`);
canvas.setAttribute('height', `${CANVAS_DIMENSIONS.y}px`);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const mapNormalXYIntoCanvasXY = ({x, y}: Coords): Coords => {
    const canvasX = x + CANVAS_DIMENSIONS.x / 2;
    const canvasY = CANVAS_DIMENSIONS.y / 2 - y;

    return { x: canvasX, y: canvasY };
}

export const emptyCanvas = () => ctx.reset();

export const drawRect = (coords: Coords, size: Coords, color?: string) => {

    const mappedCoords = mapNormalXYIntoCanvasXY(coords);
    ctx.beginPath();
    ctx.rect(mappedCoords.x, mappedCoords.y, size.x, size.y);
    if(color) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.fillStyle = 'black';
        ctx.stroke();
    }
}

export const drawLine = (start: Coords, end: Coords, lineWidth: number = 1, color: string = 'black') => {
    ctx.beginPath();
    const mappedCoordsStart = mapNormalXYIntoCanvasXY(start);
    ctx.moveTo(mappedCoordsStart.x, mappedCoordsStart.y);
    const mappedCoordsEnd = mapNormalXYIntoCanvasXY(end);
    ctx.lineTo(mappedCoordsEnd.x, mappedCoordsEnd.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

export const placeText = (pos: Coords, text: string) => {
    ctx.font = "12px serif";
    const mappedCoords = mapNormalXYIntoCanvasXY(pos);
    ctx.fillText(text, mappedCoords.x, mappedCoords.y);
}

export const drawBlocks = () => {
    //draw blocks
    BLOCKS_ARRAY.forEach((row, i) => row.forEach((block, j) => {
        if(block >= 1) {
            // draw block at i j
            drawRect({
                x: j * blockDimensions.x - CANVAS_DIMENSIONS.x / 2,
                y: - i * blockDimensions.y + CANVAS_DIMENSIONS.y / 2
            }, blockDimensions);
        }
    }))

}

export const drawPlayer = () => {
    //draw player square
    const playerSquareTopLeft = addToCanvasPos(player.coords, scalarMulVec(PLAYER_SQUARE_SIZE, -1/2));
    drawRect(playerSquareTopLeft, PLAYER_SQUARE_SIZE, 'blue')
    //draw player orientation
    const orientationUnitVector = {
        x:Math.sin(player.orientation.angle),
        y: Math.cos(player.orientation.angle)
    };
    drawLine(player.coords, addVec(player.coords, scalarMulVec(orientationUnitVector, 20)));

}

export const drawRays = () => {
    rays.forEach(({ end }: Ray) => {
        drawLine(player.coords, end, 2, 'red')

    })
}
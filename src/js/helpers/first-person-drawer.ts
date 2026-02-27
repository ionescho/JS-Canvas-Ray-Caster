import { addDebuggerMessage } from "./debugger";
import { Coords } from "./drawer";
import { Ray, rays } from "./ray-caster";

export const FIRST_PERSON_CANVAS_DIMENSIONS: Coords = {
    x: 500,
    y: 500,
};

const canvas: HTMLCanvasElement = document.getElementById('firstPersonPerspective') as HTMLCanvasElement;
canvas.setAttribute('width', `${FIRST_PERSON_CANVAS_DIMENSIONS.x}px`);
canvas.setAttribute('height', `${FIRST_PERSON_CANVAS_DIMENSIONS.y}px`);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export const drawRaysAsWalls = () => {
    ctx.reset();

    const rayStripWidth = FIRST_PERSON_CANVAS_DIMENSIONS.x / rays.length
    rays.forEach((ray: Ray, index) => {
        const inverseCoordsSum = 1 / ray.coordsSum;

        const rayStripHeight = FIRST_PERSON_CANVAS_DIMENSIONS.y * inverseCoordsSum * 20// I'm just experimenting

        ctx.beginPath();
        ctx.rect(index * rayStripWidth, FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - rayStripHeight/2, rayStripWidth, rayStripHeight);
        ctx.fillStyle = 'green';
        ctx.fill();

        // addDebuggerMessage(`Strip ${index} -> coordsSum: ${ray.coordsSum}`);
        // addDebuggerMessage(`Strip ${index} -> inverse coords sum: ${inverseCoordsSum}`);
        // addDebuggerMessage(`Strip ${index} rect -> x:${index * rayStripWidth}, y:${FIRST_PERSON_CANVAS_DIMENSIONS.y - rayStripHeight}, w:${rayStripWidth}, h: ${rayStripHeight}`);
    })
}
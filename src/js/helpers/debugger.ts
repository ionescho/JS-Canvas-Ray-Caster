import { CANVAS_DIMENSIONS } from "./drawer";
import { player } from "./player";

export const IS_DEBUGGING = true;

export function roundDec2(x: number) {
    return Math.floor(x*100) / 100
}

export let debuggerMessages: string[] = [];

export const addDebuggerMessage = (message: string) => {
    if(IS_DEBUGGING) {
        debuggerMessages.push(message);
    }
}

export const drawLegend = () => {
    const debuggerEl = document.getElementById('rayCasterDebugger') as HTMLDivElement;
    debuggerEl.innerHTML = '';

    const initialDebuggerMessages = [
        `Orientation: ${roundDec2(player.orientation.angle)} rad`,
        `Player (X,Y): (${roundDec2(player.coords.x)}, ${roundDec2(player.coords.y)})`,
        `Canvas (width,height): (${roundDec2(CANVAS_DIMENSIONS.x)}, ${roundDec2(CANVAS_DIMENSIONS.y)})`
    ];

    [...initialDebuggerMessages, ...debuggerMessages].forEach((message, index) => {
        debuggerEl.innerHTML += `<p>${message}</p>`
    })
}
import { Coords } from "./drawer";

export const addVec = (a: Coords, b: Coords): Coords => {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    }
}
export const subVec = (a: Coords, b: Coords): Coords => {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    }
}
export const scalarMulVec = (a: Coords, scalar: number): Coords => {
    return {
        x: a.x * scalar,
        y: a.y * scalar,
    }
}

export const addToCanvasPos = (a: Coords, d: Coords) => {
    return {
        x: a.x + d.x,
        y: a.y - d.y,
    }
}
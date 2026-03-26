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
export const perpendicularVector = (v: Coords): Coords => {
    return {
        x: -v.y,
        y: v.x
    };
}
export const vectorMagnitude = (v: Coords): number => {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}
export const unitVector = (v: Coords): Coords => {
    const magnitude = vectorMagnitude(v);
    return {
        x: v.x / magnitude,
        y: v.y / magnitude,
    }
}
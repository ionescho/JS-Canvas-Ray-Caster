import { CONFIG, configObservable } from "../config";
import { Coords } from "../drawer";
import { Ray, rays } from "../ray-caster";
import { FIRST_PERSON_CANVAS_DIMENSIONS, firstPersonDrawer } from "./drawer";
import { floorsAndCeilingsRasterizer } from "./floors-and-ceiling-rasterizer";
import { spritesRasterizer } from "./sprites-rasterizer";
import { wallRasterizer } from "./wall-rasterizer";

export type PixelMapType = {
    startPixelPos: Coords;
    rectLength: Coords;
    r: number;
    g: number;
    b: number;
    a: number;
}[]

const FIRST_PERSON_CANVAS_PIXEL_MAP: PixelMapType = []

let VIRTUAL_PROJECTION_PLANE_HEIGHT
const initProjectionPlaneHeight = () => {
    VIRTUAL_PROJECTION_PLANE_HEIGHT = 2 * CONFIG.HALF_FIELD_OF_VIEW_LENGTH;}
setTimeout(() => {
    initProjectionPlaneHeight()
})
configObservable.registerListener(initProjectionPlaneHeight)

export const drawRaysAsWallsAndFloors = () => {
    FIRST_PERSON_CANVAS_PIXEL_MAP.length = 0;

    const rayStripWidth = FIRST_PERSON_CANVAS_DIMENSIONS.x / rays.length

    rays.forEach((ray: Ray, rayIndex) => {
        const verticalPixelsLeftForFloor: number = wallRasterizer(ray, rayIndex, rayStripWidth, VIRTUAL_PROJECTION_PLANE_HEIGHT, FIRST_PERSON_CANVAS_PIXEL_MAP)

        if(verticalPixelsLeftForFloor > 0 && CONFIG.drawFloors) {
            floorsAndCeilingsRasterizer(ray, rayIndex, rayStripWidth, verticalPixelsLeftForFloor, FIRST_PERSON_CANVAS_PIXEL_MAP)
        }
    })

    spritesRasterizer(FIRST_PERSON_CANVAS_PIXEL_MAP);

    firstPersonDrawer(FIRST_PERSON_CANVAS_PIXEL_MAP)
}
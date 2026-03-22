import { PixelMapType } from ".";
import { CONFIG } from "../config";
import { Coords } from "../drawer";

export const FIRST_PERSON_CANVAS_DIMENSIONS: Coords = {
    x: 500,
    y: 500,
};
//canvas init
const canvas: HTMLCanvasElement = document.getElementById('firstPersonPerspective') as HTMLCanvasElement;
canvas.setAttribute('width', `${FIRST_PERSON_CANVAS_DIMENSIONS.x}px`);
canvas.setAttribute('height', `${FIRST_PERSON_CANVAS_DIMENSIONS.y}px`);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;


export const firstPersonDrawer = (pixelMap: PixelMapType) => {

        const imageData = new ImageData(FIRST_PERSON_CANVAS_DIMENSIONS.x, FIRST_PERSON_CANVAS_DIMENSIONS.y);
        
        ctx.reset();
        if(CONFIG.firstPersonDrawMethod === 'rects') {
            ctx.beginPath();
            // Iterate through every strip
            for (var i = 0; i < pixelMap.length; i++) {
                const {startPixelPos, rectLength, r, g, b, a} = pixelMap[i]
                ctx.rect(startPixelPos.x, startPixelPos.y, rectLength.x, rectLength.y);
            }
            ctx.fillStyle = `rgba(0, 0, 0, 1)`;
            ctx.fill();

        } else {
            // Iterate through every strip
            for (var i = 0; i < pixelMap.length; i++) {
                const {startPixelPos, rectLength, r, g, b, a} = pixelMap[i]
            
                const startPixelXRounded = Math.round(startPixelPos.x);
                const startPixelYRounded = Math.round(startPixelPos.y);
                const endPixelXRounded = startPixelXRounded + Math.round(rectLength.x);
                const endPixelYRounded = startPixelYRounded + Math.round(rectLength.y);

                let imageDataIndex
                for(var y = startPixelYRounded; y < endPixelYRounded; y++) {
                    imageDataIndex = (y * FIRST_PERSON_CANVAS_DIMENSIONS.x + startPixelXRounded) * 4
                    for(var x = startPixelXRounded; x < endPixelXRounded; x++) {
                        imageData.data[imageDataIndex + 0] = r; // R value
                        imageData.data[imageDataIndex + 1] = g; // G value
                        imageData.data[imageDataIndex + 2] = b; // B value
                        imageData.data[imageDataIndex + 3] = a * 255; // A value

                        imageDataIndex += 4
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0)
        }
}
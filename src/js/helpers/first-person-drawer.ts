import { blockDimensions, textures } from "./blocks";
import { config } from "./config";
import { addDebuggerMessage } from "./debugger";
import { Coords } from "./drawer";
import { player } from "./player";
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
    const WALL_HEIGHT = blockDimensions.x;
    ctx.reset();

    const rayStripWidth = FIRST_PERSON_CANVAS_DIMENSIONS.x / rays.length
    rays.forEach((ray: Ray, index) => {

        if(!ray.hitBlockRelativePos) {
            return;
        }



        let fishEyeCorrection = 1;
        if(config.applyFishEyeCorrection) {
            //apply cos of below angle for fisheye correction
            const angleBetweenRayAndPlayerOrientation = ray.angle - player.orientation.angle;
            fishEyeCorrection = Math.cos(angleBetweenRayAndPlayerOrientation);
        }
        
        const inverseDistance = 1 / (ray.magnitude * fishEyeCorrection );


        const rayStripHeight = FIRST_PERSON_CANVAS_DIMENSIONS.y * inverseDistance * WALL_HEIGHT;

        // simple no textures
        // ctx.beginPath();
        // ctx.rect(index * rayStripWidth, FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - rayStripHeight/2, rayStripWidth, rayStripHeight);
        // ctx.fillStyle = `rgba(0, 0, 255, ${ray.horizontalCollision ? '1' : '0.7'})`;
        // ctx.fill();
        // simple no textures end

        const wallVerticalFragmentStripIndex = Math.round(ray.hitBlockRelativePos * textures[0].length);
        const correspondingTextureStrip = textures.map((textureRow) => textureRow[wallVerticalFragmentStripIndex]);

        // let finishedDrawingStrip = false;
        let coloredSubStripStart = 0;
        let coloredSubStripLength = 0;
        let texturedStripIndex = 0;
        while(texturedStripIndex <= correspondingTextureStrip.length + 1) {
            if(correspondingTextureStrip[texturedStripIndex] === 1) {
                coloredSubStripLength++;
            } else {
                if(correspondingTextureStrip[texturedStripIndex-1] && correspondingTextureStrip[texturedStripIndex-1] !== correspondingTextureStrip[texturedStripIndex]){
                    const subStripHeight = rayStripHeight * coloredSubStripLength / correspondingTextureStrip.length;
                    const subStripStart = rayStripHeight * coloredSubStripStart / correspondingTextureStrip.length;

                    ctx.beginPath();
                    ctx.rect(index * rayStripWidth, FIRST_PERSON_CANVAS_DIMENSIONS.y/2 - rayStripHeight/2 + subStripStart, rayStripWidth, subStripHeight);
                    ctx.fillStyle = `rgba(0, 0, 0, 1)`;
                    ctx.fill();
                }
                coloredSubStripStart = texturedStripIndex + 1;
                coloredSubStripLength = 0;
            }
            texturedStripIndex++
        }

        // addDebuggerMessage(`Strip ${index} -> magnitude: ${ray.magnitude}`);
        // addDebuggerMessage(`Strip ${index} -> inverse coords sum: ${inverseDistance}`);
        // addDebuggerMessage(`Strip ${index} rect -> x:${index * rayStripWidth}, y:${FIRST_PERSON_CANVAS_DIMENSIONS.y - rayStripHeight}, w:${rayStripWidth}, h: ${rayStripHeight}`);
    })
}
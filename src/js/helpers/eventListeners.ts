export const movementKeysPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
    strafeLeft: false,
    strafeRight: false,
}

window.addEventListener('keydown', (event:KeyboardEvent) => {
    switch(event.key) {
        case 'w':
        case 'ArrowUp':
            movementKeysPressed.up = true
            break;
        case 'q':
        case 'ArrowLeft':
            movementKeysPressed.left = true
            break;
        case 's':
        case 'ArrowDown':
            movementKeysPressed.down = true
            break;
        case 'e':
        case 'ArrowRight':
            movementKeysPressed.right = true
            break;
        case 'a':
            movementKeysPressed.strafeLeft = true
            break;
        case 'd':
            movementKeysPressed.strafeRight = true
            break;
    }
})
window.addEventListener('keyup', (event:KeyboardEvent) => {
    switch(event.key) {
        case 'w':
        case 'ArrowUp':
            movementKeysPressed.up = false
            break;
        case 'q':
        case 'ArrowLeft':
            movementKeysPressed.left = false
            break;
        case 's':
        case 'ArrowDown':
            movementKeysPressed.down = false
            break;
        case 'e':
        case 'ArrowRight':
            movementKeysPressed.right = false
            break;
        case 'a':
            movementKeysPressed.strafeLeft = false
            break;
        case 'd':
            movementKeysPressed.strafeRight = false
            break;
    }
})

const firstPersonCanvas: HTMLCanvasElement = document.getElementById('firstPersonPerspective') as HTMLCanvasElement;
firstPersonCanvas.addEventListener("click", async () => {
  if (!document.pointerLockElement) {
    await firstPersonCanvas.requestPointerLock({
      unadjustedMovement: true,
    });
  }
});

let mouseStopTimeout;
firstPersonCanvas.addEventListener('mousemove', function(e) {

    if (document.pointerLockElement===firstPersonCanvas) {
        if(mouseStopTimeout) {
            clearTimeout(mouseStopTimeout)
        }
        movementKeysPressed[e.movementX < 0 ? 'left' : 'right'] = true
        setTimeout(() => {
            movementKeysPressed.left = false;
            movementKeysPressed.right = false;
        }, 20)
    } else {
        // ignore
    }
}, false);
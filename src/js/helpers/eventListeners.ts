
export const movementKeysPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
}

window.addEventListener('keydown', (event:KeyboardEvent) => {
    switch(event.key) {
        case 'w':
        case 'ArrowUp':
            movementKeysPressed.up = true
            break;
        case 'a':
        case 'ArrowLeft':
            movementKeysPressed.left = true
            break;
        case 's':
        case 'ArrowDown':
            movementKeysPressed.down = true
            break;
        case 'd':
        case 'ArrowRight':
            movementKeysPressed.right = true
            break;
    }
})
window.addEventListener('keyup', (event:KeyboardEvent) => {
    switch(event.key) {
        case 'w':
        case 'ArrowUp':
            movementKeysPressed.up = false
            break;
        case 'a':
        case 'ArrowLeft':
            movementKeysPressed.left = false
            break;
        case 's':
        case 'ArrowDown':
            movementKeysPressed.down = false
            break;
        case 'd':
        case 'ArrowRight':
            movementKeysPressed.right = false
            break;
    }
})
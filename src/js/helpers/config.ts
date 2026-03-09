
export const config = {
    applyFishEyeCorrection: true,
    rayCastingType: 'circular'
};

document.getElementById("fishEyeCorrection")?.addEventListener('click', (event: MouseEvent) => {
    config.applyFishEyeCorrection = (event.target as HTMLInputElement)?.checked;
})

document.querySelectorAll(".projectionType").forEach((element) => {
    (element as HTMLInputElement).addEventListener('click', (event: MouseEvent) => {
        config.rayCastingType = (event.target as HTMLInputElement)?.value;
        console.log('config.rayCastingType', config.rayCastingType)
    })
});
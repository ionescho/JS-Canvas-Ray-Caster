
export const CONFIG = {
    HALF_FIELD_OF_VIEW: Math.PI/6, // field of view is the same on horizontal and on vertical so far
    applyFishEyeCorrection: true,
    rayCastingType: 'plane',
    applyTextures: true,
    drawFloors: true,
    firstPersonDrawMethod: 'rects',
};

export const configObservable: {
    listeners: (() => void)[];
    registerListener: (callback: () => void) => void;
    callListeners: () => void;
} = {
    listeners: [],
    registerListener: (callback: () => void) => {
        configObservable?.listeners.push(callback);
    },
    callListeners: () => {
        configObservable.listeners.forEach(listener => listener());
    }
}

document.getElementById("fishEyeCorrection")?.addEventListener('click', (event: MouseEvent) => {
    CONFIG.applyFishEyeCorrection = (event.target as HTMLInputElement)?.checked;

    configObservable.callListeners();
})

document.querySelectorAll(".projectionType").forEach((element) => {
    (element as HTMLInputElement).addEventListener('click', (event: MouseEvent) => {
        CONFIG.rayCastingType = (event.target as HTMLInputElement)?.value;

        configObservable.callListeners();
    })
});

document.getElementById("fieldOfView")?.addEventListener('input', (event) => {
    const FOV =  Math.round(Number((event.target as HTMLInputElement)?.value) * 100) / 100;
    CONFIG.HALF_FIELD_OF_VIEW = FOV/2;

    (document.getElementById("fieldOfViewValue") as HTMLSpanElement).innerHTML = `${Math.round(100 * 180 * FOV / Math.PI)/ 100}`

    configObservable.callListeners();
})

document.getElementById("applyTextures")?.addEventListener('click', (event: MouseEvent) => {
    CONFIG.applyTextures = (event.target as HTMLInputElement)?.checked;

    configObservable.callListeners();
})

document.getElementById("drawFloors")?.addEventListener('click', (event: MouseEvent) => {
    CONFIG.drawFloors = (event.target as HTMLInputElement)?.checked;

    configObservable.callListeners();
})

document.querySelectorAll(".firstPersonDrawMethod").forEach((element) => {
    (element as HTMLInputElement).addEventListener('click', (event: MouseEvent) => {
        CONFIG.firstPersonDrawMethod = (event.target as HTMLInputElement)?.value;

        configObservable.callListeners();
    })
});
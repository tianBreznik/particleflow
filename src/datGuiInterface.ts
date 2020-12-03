import {GUI} from "dat.gui";

export enum velocity_attractors {
    "gravity",
    "aizawaAttractor",
    "thomasAttractor",
}

export const parameters = {

    "Time Step": 0.1,
    "Point Size": 2.0,
    "Particle Life-time(ms)": 1200.0,
    //"Particle color": - todo

    //restart
    "Simulation Type": `${velocity_attractors.aizawaAttractor}`,
    "Texture Size (Particles)": "512",
    "Square Geometry": false,
    "Square Geometry Scale": 1,
    "Include Velocity":true
}

export function initGUI(onChange: () => void, restartSimulation: () => void, resetCamera: () => void) {
    const gui = new GUI({width: 400})

    const resetCameraButton = {
        "Reset Camera": () => resetCamera()
    }

    gui.add(resetCameraButton, "Reset Camera")

    const changeableFolder = gui.addFolder("Changeable")
    changeableFolder.add(parameters, "Time Step", 0.01, 1, 0.001).onChange(onChange)
    changeableFolder.add(parameters, "Point Size", 1.0, 5.0, 1).onChange(onChange)
    changeableFolder.add(parameters, "Particle Life-time(ms)", 0, 60*30, 5).onChange(onChange)

    const restartFolder = gui.addFolder("Static Parameters (Change and restart simulation)")
    restartFolder.add(parameters,"Simulation Type", {
        "Gravity": velocity_attractors.gravity,
        "Aizawa Attractor": velocity_attractors.aizawaAttractor,
        "Thomas Attractor": velocity_attractors.thomasAttractor,
    })
    restartFolder.add(parameters, "Texture Size (Particles)", {
        "1": 1,
        "4": 2,
        "16": 4,
        "128^2 (16,384)": 128,
        "256^2 (65,536)": 256,
        "512^2 (262,144)": 512,
        "1024^2 (1,048,576)": 1024,
        "2048^2 (4,194,304)": 2048,
        "4096^2 (16,777,216)": 4096,
        "8192^2 (67,108,864)": 8192
    })
    restartFolder.add(parameters, "Square Geometry")
    restartFolder.add(parameters, "Square Geometry Scale", 0.1, 10, 0.1)


    const restartButton = {
        "Restart Simulation": () => restartSimulation()
    }
    restartFolder.add( restartButton, 'Restart Simulation' )

    restartFolder.open()
    changeableFolder.open()
}


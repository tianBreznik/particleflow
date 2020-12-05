import {GUI} from "dat.gui";

export enum velocity_attractors {
    "aizawaAttractor",
    "thomasAttractor",
    "chenAttractor",
    "lotkaVolteraAttractor",
    "layerAttractor"
}

export enum noise_simulations {
    "simplexNoise",
    "curlNoise",
    "classicPerlin"
}
export const parameters = {

    "Time Step": 0.1,
    "Point Size": 2.0,
    "Particle Life-time(ms)": 1200.0,
    //"Particle color": - todo

    //restart
    "Attractor": `${velocity_attractors.chenAttractor}`,
    "Base Noise Version": `${noise_simulations.curlNoise}`,
    "Texture Size (Particles)": "512",
    "Square Geometry": false,
    "Square Geometry Scale": 1,
    "INCLUDE ATTRACTOR?":false
}

export function buildInterface(onChange: () => void, restartSimulation: () => void, resetCamera: () => void) {
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
    restartFolder.add(parameters,"Attractor", {
        "Aizawa Attractor": velocity_attractors.aizawaAttractor,
        "Thomas Attractor": velocity_attractors.thomasAttractor,
        "Chen Attractor": velocity_attractors.chenAttractor,
        "Lotka Voltera Attractor": velocity_attractors.lotkaVolteraAttractor,
        "Layer Attractor":velocity_attractors.layerAttractor
    })
    restartFolder.add(parameters,"Base Noise Version", {
        "Simplex Noise": noise_simulations.simplexNoise,
        "Curl Noise": noise_simulations.curlNoise,
        "Classic Perlin Noise":noise_simulations.classicPerlin
    })
    restartFolder.add(parameters,"INCLUDE ATTRACTOR?")
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


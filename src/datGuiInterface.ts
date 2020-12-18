import {GUI} from "dat.gui";
import {Vector3} from "three"

export enum velocity_attractors {
    "halvorsenAttractor",
    "thomasAttractor",
    "chenAttractor",
    "luChenAttractor",
    "fourWingAttractor",
    "layerAttractor"
}

export enum initial_geometry {
    "cube",
    "sphere"
}

export enum noise_simulations {
    "simplexNoise",
    "curlNoise",
    "classicPerlin"
}
export const parameters = {

    "Time Step✨": 0.1,
    "Point Size🍆": 1.0,
    "Normalize Factor✨:": 0.1,
    "Particle Life-time(ms)": 1200.0,
    "Fading/Dying🥺:": false,
    "color": "#000000",
    //"Particle color": - todo

    //restart
    "Attractor": `${velocity_attractors.thomasAttractor}`,
    "Base Noise Version": `${noise_simulations.simplexNoise}`,
    "Start in the shape of:": `${initial_geometry.sphere}`,
    "Texture Size (Particles)": "512",
    "Random Sprite Colors?":false,
    "Sprite textures?": true,
    "Sprite Texture Size": 1.0,
    "INCLUDE ATTRACTOR?🌀":true,
    "Background Color": "#ffffff"
}

export function buildInterface(onChange: () => void, restartSimulation: () => void) {
    const gui = new GUI({width: 400})


    const changeableFolder = gui.addFolder("Changeable")
    changeableFolder.add(parameters, "Time Step✨", 0.01, 1, 0.001).onChange(onChange)
    changeableFolder.add(parameters, "Point Size🍆", 1.0, 5.0, 1).onChange(onChange)
    changeableFolder.add(parameters, "Fading/Dying🥺:").onChange(onChange)
    changeableFolder.add(parameters, "Normalize Factor✨:",0.0, 1.0, 0.1).onChange(onChange)
    //changeableFolder.addColor(parameters, "color").onChange(onChange)

    const spriteFolder = gui.addFolder("Sprite Settings/Changeable")
    spriteFolder.add(parameters, "Random Sprite Colors?").onChange(onChange)
    spriteFolder.addColor(parameters, "color").onChange(onChange)
    spriteFolder.add(parameters, "Sprite Texture Size", 0.1, 10, 0.5).onChange(onChange)

    const restartFolder = gui.addFolder("Static Parameters (Change and restart simulation)")
    restartFolder.addColor(parameters, "Background Color")
    restartFolder.add(parameters,"Start in the shape of:", {
        "Cube": initial_geometry.cube,
        "Sphere": initial_geometry.sphere
    })
    restartFolder.add(parameters,"Attractor", {
        "Halvorsen Attractor": velocity_attractors.halvorsenAttractor,
        "Thomas Attractor": velocity_attractors.thomasAttractor,
        "Chen Attractor": velocity_attractors.chenAttractor,
        "Lu Chen Attractor": velocity_attractors.luChenAttractor,
        "Four Wing Attractor": velocity_attractors.fourWingAttractor,
        "Layer Attractor":velocity_attractors.layerAttractor
    })
    restartFolder.add(parameters,"Base Noise Version", {
        "Simplex Noise": noise_simulations.simplexNoise,
        "Curl Noise": noise_simulations.curlNoise,
        "Classic Perlin Noise":noise_simulations.classicPerlin
    })
    restartFolder.add(parameters,"INCLUDE ATTRACTOR?🌀")
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
    restartFolder.add(parameters, "Sprite textures?")
    restartFolder.add(parameters, "Particle Life-time(ms)", 0, 60*30, 5)
    //restartFolder.addColor(parameters, "color").onChange(function() {
    //    console.log(parameters.color)
    //})



    const restartButton = {
        "Restart Simulation": () => restartSimulation()
    }
    restartFolder.add( restartButton, 'Restart Simulation' )

    restartFolder.open()
    changeableFolder.open()
    spriteFolder.open()
}





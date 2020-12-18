export declare enum velocity_attractors {
    "aizawaAttractor" = 0,
    "thomasAttractor" = 1,
    "chenAttractor" = 2,
    "lotkaVolteraAttractor" = 3,
    "layerAttractor" = 4
}
export declare enum initial_geometry {
    "cube" = 0,
    "sphere" = 1
}
export declare enum noise_simulations {
    "simplexNoise" = 0,
    "curlNoise" = 1,
    "classicPerlin" = 2
}
export declare const parameters: {
    "Time Step": number;
    "Point Size": number;
    "Particle Life-time(ms)": number;
    "Fading/Dying:": boolean;
    color: string;
    Attractor: string;
    "Base Noise Version": string;
    "Start in the shape of:": string;
    "Texture Size (Particles)": string;
    "Random Sprite Colors?": boolean;
    "Sprite textures?": boolean;
    "Sprite Texture Size": number;
    "INCLUDE ATTRACTOR?": boolean;
    "Background Color": string;
};
export declare function buildInterface(onChange: () => void, restartSimulation: () => void): void;

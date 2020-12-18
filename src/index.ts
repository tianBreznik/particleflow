import {
    AmbientLight,
    AdditiveBlending,
    BufferAttribute,
    BoxGeometry, BufferGeometry,
    Fog,
    HalfFloatType,
    Mesh,
    MeshBasicMaterial, MeshLambertMaterial,
    PerspectiveCamera, PointLight, Points,
    Scene, ShaderMaterial,
    TOUCH,
    Vector3,
    WebGLRenderer,
    WebGLRenderTarget,
    RepeatWrapping,
    Texture,
    DataTexture, TextureLoader, Color, NormalBlending
} from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import * as Stats from 'stats.js'
import {WEBGL} from "three/examples/jsm/WebGL";
import {GPUComputationRenderer, Variable} from "three/examples/jsm/misc/GPUComputationRenderer";
import {
    parameters,
    velocity_attractors,
    noise_simulations,
    buildInterface,
    initial_geometry
} from "./datGuiInterface";




let stats
let renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    geometry: BoxGeometry,
    material:MeshLambertMaterial,
    mesh:Mesh,
    light:AmbientLight,
    p_light:PointLight,
    buff_geometry: BufferGeometry,
    particle_mesh: Points,
    particle_mat: ShaderMaterial,
    sprite_mat: ShaderMaterial,
    gpuCompute: GPUComputationRenderer,
    particle_texture_init_position:Texture,
    particle_texture_position:Texture,
    particle_texture_sim: Texture,
    particle_position_var: Variable,
    particle_position_var_sim:Variable,
    particle_position_uniforms,
    particle_sim_var_uniforms,
    width, height
const bufferHeight = 1024
const bufferWidth = 1024
const currentMaxVal = 7
var timer = 0
var perlinTick = 0

let particlesLoaded = false
let sceneReady = false
let loading = true

width = window.innerWidth
height = window.innerHeight

sprite_mat = new ShaderMaterial({
    uniforms:{
        texturePosition:{
            value: null,
        },
        color: {
            value: new Color("0xffffff"),
        },
        random_color:{
            value: parameters["Random Sprite Colors?"],
        },
        pointSize: {
            value:  parameters["Sprite Texture Size"] * 1.0,
        },
        sprite_texture: {
            value: new TextureLoader().load("https://threejs.org/examples/textures/sprites/ball.png")
        },
        particle_lifetime:{
            value: parameters["Particle Life-time(ms)"]
        },
        current_life:{
            value: parameters["Particle Life-time(ms)"]
        },
        r:{
            value:hexToRgb(parameters["color"]).r
        },
        g:{
            value:hexToRgb(parameters["color"]).g
        },
        b:{
            value:hexToRgb(parameters["color"]).b
        },
        height:{
            value: height
        },
        width:{
            value: width
        }
    },
    vertexShader:`
        uniform sampler2D texturePosition;
        uniform float pointSize;
        uniform float height;
        uniform float width;
        varying vec2 vUv;
        
        attribute vec3 customColor;
        //attribute vec3 offset;
        attribute float alpha;

        varying float vAlpha;
        varying vec3 vColor;

        // Pseudo random number generator
        float rand(vec2 co)
        {
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }


        void main()
        {
            vColor = customColor;
            vAlpha = alpha;
            vUv = position.xy + vec2( 0.5 / width, 0.5 / height );
        
            vec3 position = ( texture2D( texturePosition, vUv ).rgb  );
        
            gl_PointSize = pointSize;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        
        }
    `,
    fragmentShader: `
        precision highp float;
        uniform float particle_lifetime;
        uniform float current_life;
        uniform vec3 color;
        uniform sampler2D sprite_texture;
        uniform bool random_color;
        uniform float r;
        uniform float g;
        uniform float b;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }
        float opacified_life;
        
        void main() {
            float red = map(r, 0.0, 255.0, 0.0, 1.0);
            float green = map(g, 0.0, 255.0, 0.0, 1.0);
            float blue = map(b, 0.0, 255.0, 0.0, 1.0);
            vec3 set_color = vec3(red,green,blue);
            opacified_life = map(particle_lifetime, 0.0, current_life, 0.0, 1.0);
            if(!random_color){
                gl_FragColor = vec4( color * set_color, opacified_life );
            }
            else{
                gl_FragColor = vec4( color * vColor, opacified_life );
            }
            gl_FragColor = gl_FragColor * texture2D( sprite_texture, gl_PointCoord );
        }`,
        blending: NormalBlending,
        transparent: true,
        fog: false,
        lights: false,
        depthWrite: false,
        depthTest: false

})
particle_mat = new ShaderMaterial({
    uniforms: {
        texturePosition: {
            value: null,
        },
        pointSize: {
            value:  parameters["Point Size"] * 1.0
        },//temp - experiment
        particle_lifetime:{
            value: parameters["Particle Life-time(ms)"]
        },
        current_life:{
            value: parameters["Particle Life-time(ms)"]
        },
        r:{
            value:hexToRgb(parameters["color"]).r
        },
        g:{
            value:hexToRgb(parameters["color"]).g
        },
        b:{
            value:hexToRgb(parameters["color"]).b
        },
        height:{
            value: height
        },
        width:{
            value: width
        }
    },
    vertexShader: `
    uniform sampler2D texturePosition;
    uniform float pointSize;
    uniform float height;
    uniform float width;
    varying vec2 vUv;
    

    // Pseudo random number generator
    float rand(vec2 co)
    {
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    


    void main()
    {
        vUv = position.xy + vec2( 0.5 / width, 0.5 / height );

        vec3 position = ( texture2D( texturePosition, vUv ).rgb  );

        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,
    fragmentShader: `
    uniform float particle_lifetime;
    uniform float current_life;
    uniform float r;
    uniform float g;
    uniform float b;
    float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
    float opacified_life;
    void main()
    {
        opacified_life = map(particle_lifetime, 0.0, current_life, 0.0, 1.0);
        gl_FragColor = vec4( 0.2,0.1,0.8,opacified_life);
        gl_FragColor *= 1.5;
    }`,
    blending: AdditiveBlending,
    transparent: true,
    fog: false,
    lights: false,
    depthWrite: false,
    depthTest: false
})

if (WEBGL.isWebGLAvailable()) {
    stats = new Stats()
    document.body.appendChild(stats.dom)

    buildInterface(onChange, restartSimulation)


    try {
        // @ts-ignore declaration is missing failIfMajorPerformanceCaveat for some reason
        renderer = new WebGLRenderer({antialias: true, failIfMajorPerformanceCaveat: true})
    } catch (err) {
        console.error("Appropriate Hardware Requirements weren't met")
        // todo
    }

    //ex shader
    //    uniform float pointSize;
    //     void main() {
    //         //the mesh is a normalized square so the uvs = the xy positions of the vertices
    //         vec3 pos = texture2D( texturePosition, position.xy ).xyz;
    //
    //         //pos now contains the position of a point in space taht can be transformed
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
    //
    //         gl_PointSize = pointSize;
    //     }
    //



    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor('#080808')//#ffffff

    renderer.sortObjects = false

    document.body.appendChild(renderer.domElement)

    //camera = new PerspectiveCamera(35, width / height, 0.1, 3000)
    scene = new Scene()

    //light = new AmbientLight(0xffffff,0.5)
    //p_light = new PointLight(0xffffff,0.5)
    //scene.add(light)
    //scene.add(p_light)

    // geometry = new BoxGeometry(100,100,100)
    // material = new MeshLambertMaterial({color:0xF3FFE2});
    // mesh = new Mesh(geometry, material)
    // mesh.position.set(0,0,-1000)
    // scene.add(mesh)

    camera = new PerspectiveCamera(60, width / height, 0.00001, 100_000_000)
    camera.position.copy(new Vector3(10, 25, 35))

    const controls = new OrbitControls(camera, renderer.domElement)
    // TODO tweak
    controls.enablePan = true
    controls.rotateSpeed = 0.5
    controls.enableDamping = true
    controls.dampingFactor = 0.9
    controls.touches = {ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN}
    controls.update()

    //particle positions - normalized
    const p_positions = new Float32Array((width * height) * 3)
    const colors = new Float32Array((width * height) * 3);
    //const sizes = new Float32Array(1000);
    const alphas = new Float32Array((width * height));
    for (let i = 0; i < (width * height); i++) {
        p_positions[i * 3] = (i % width) / width
        p_positions[i * 3 + 1] = (i / width) / height

        //randomize sprite colors
        colors[i * 3 + 0] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();
        //console.log(colors[i*3] + ', ' + colors[i*3+1] + ', ' + colors[i*3+2])

        //size and opacity
        //sizes[i] = 300;
        alphas[i] = 0.5;
    }


    buff_geometry = new BufferGeometry()
    buff_geometry.setAttribute('position', new BufferAttribute(p_positions, 3))
    buff_geometry.setAttribute( 'customColor', new BufferAttribute( colors, 3 ) )
    //buff_geometry.setAttribute( 'size', new BufferAttribute( sizes, 1 ) );
    buff_geometry.setAttribute( 'alpha', new BufferAttribute( alphas, 1 ) )

    //particle_mesh = new Points(buff_geometry, particle_mat)

    fetchAndStart()
    //animate()



} else {
    const warning = WEBGL.getWebGLErrorMessage()
    document.body.appendChild(warning)
}


function updateParticleMesh() {
    // @ts-ignore
    particle_mesh.material.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(particle_position_var).texture
    // @ts-ignore
    //console.log(particle_mesh.material.uniforms)
}

function noisePositions(width: number, height: number, maxVal: number): Float32Array {
    let len = width *  height * 4
    const randomData = new Float32Array(len)

    while (len--) {
        randomData[len] = (Math.random() * 2 - 1) * maxVal
    }

    return randomData
}

Math.cbrt = Math.cbrt || function(x) {
    var y = Math.pow(Math.abs(x), 1/3);
    return x < 0 ? -y : y;
};


function getPoint(v,size)
{
    var phi = Math.random() * 2 * Math.PI;
    var costheta = Math.random() * 2 -1;
    var u = Math.random();

    var theta = Math.acos( costheta );
    var r = size * Math.cbrt( u );

    v.x = r * Math.sin( theta) * Math.cos( phi );
    v.y = r * Math.sin( theta) * Math.sin( phi );
    v.z = r * Math.cos( theta );
    return v;
}

function getSphere( count, size ){
    var len = count * 4;
    var data = new Float32Array( len );
    var p = new Vector3();
    for( var i = 0; i < len; i+=4 )
    {
        getPoint( p, size );
        data[ i     ] = p.x;
        data[ i + 1 ] = p.y;
        data[ i + 2 ] = p.z;
    }
    return data;
}


function isSafari() {
    return !!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i)
}

function fillPositionTextures(texturePosition: DataTexture, initialPositions: Float32Array) {
    const posArray = texturePosition.image.data

    for (let i = 0; i < posArray.length; i++) {
        if ((i + 1) % 4) {
            posArray[i] = initialPositions[i]
        } else {
            posArray[i] = Math.random() * 800 // Set a random time lived
        }
    }

}

function onChange() {
    changePointSizeParam()
}

function changePointSizeParam(){
    particle_mat.uniforms["pointSize"] = {value: parameters["Point Size"] * 1.0}
    sprite_mat.uniforms["pointSize"] = {value: parameters["Sprite Texture Size"] * 1.0}
    sprite_mat.uniforms["r"] = {value: hexToRgb(parameters["color"]).r}
    sprite_mat.uniforms["g"] = {value: hexToRgb(parameters["color"]).g}
    sprite_mat.uniforms["b"] = {value: hexToRgb(parameters["color"]).b}
    sprite_mat.uniforms["random_color"] = {value: parameters["Random Sprite Colors?"]}
    particle_sim_var_uniforms["timestep"] = {value: parameters["Time Step"]}
    particle_sim_var_uniforms["normalizeFactor"] = {value: parameters["Normalize Factor:"]}

    //console.log("sprite size" + sprite_mat.uniforms["pointSize"])
}


function restartSimulation() {
    scene.remove(particle_mesh)

    particlesLoaded = false
    sceneReady = false

    dispose_buffers()

    sprite_mat.uniforms["r"] = {value: hexToRgb(parameters["color"]).r}
    sprite_mat.uniforms["g"] = {value: hexToRgb(parameters["color"]).g}
    sprite_mat.uniforms["b"] = {value: hexToRgb(parameters["color"]).b}
    sprite_mat.uniforms["pointSize"] = {value: parameters["Sprite Texture Size"]}
    particle_mat.uniforms["particle_lifetime"].value = parameters["Particle Life-time(ms)"]
    sprite_mat.uniforms["particle_lifetime"].value = parameters["Particle Life-time(ms)"]
    console.log("sprite size" + sprite_mat.uniforms["pointSize"].value)
    fetchAndStart()
}


function fetchAndStart() {

    renderer.setClearColor(parameters["Background Color"])
    const bufferWidth = Number(parameters["Texture Size (Particles)"])
    const bufferHeight = Number(parameters["Texture Size (Particles)"])
    if(Number(parameters["Start in the shape of:"]) == initial_geometry.cube){
        const randomStartingPositions = noisePositions(1024, 1024, 7.0)
        const randomBounds = new Float32Array(3)
        randomBounds[0] = randomBounds[1] = randomBounds[2] = 2 * 7.0
        fetchAndPlay(randomStartingPositions, 1024, 1024, randomBounds)
    }
    else if(Number(parameters["Start in the shape of:"]) == initial_geometry.sphere){
        const spherePos = getSphere( bufferWidth * bufferHeight, 7 )
        const randomBounds = new Float32Array(3)
        randomBounds[0] = randomBounds[1] = randomBounds[2] = 2 * 7.0
        fetchAndPlay(spherePos, bufferWidth, bufferHeight, randomBounds)
    }
}

function fetchAndPlay(particleNoisePos: Float32Array, particleBufferWidth: number, particleBufferHeight: number, randomBounds: Float32Array) {
    let attractor_shader = fetchAttractorShader()
    let noise_shader = fetchNoiseShader()
    console.log("bla")
    console.log(attractor_shader)
    gpuCompute = new GPUComputationRenderer(particleBufferWidth, particleBufferHeight, renderer)

    if (isSafari()) {
        gpuCompute.setDataType(HalfFloatType)
    }
    const render_sprites = parameters["Sprite textures?"]
    particle_mesh =  render_sprites ?  new Points(buff_geometry, sprite_mat) :  new Points(buff_geometry, particle_mat)

    particle_texture_position = gpuCompute.createTexture() // (x,y,z) pos + (w) time of life of particle
    particle_texture_init_position = gpuCompute.createTexture()
    particle_texture_sim = gpuCompute.createTexture()

    fillPositionTextures(particle_texture_position, particleNoisePos)
    fillPositionTextures(particle_texture_init_position, particleNoisePos)

    particle_position_var = gpuCompute.addVariable("texturePosition", noise_shader, particle_texture_position)
    particle_position_var.wrapS = RepeatWrapping
    particle_position_var.wrapT = RepeatWrapping

    particle_position_uniforms = particle_position_var.material.uniforms
    particle_position_uniforms["initialPositions"] = {value: particle_texture_init_position}
    particle_position_uniforms["perlinTick"] = {value: perlinTick}
    particle_position_uniforms["life_time"] = {value: parameters["Particle Life-time(ms)"]}
    particle_position_uniforms["includeVelocity"] = {value: parameters["INCLUDE ATTRACTOR?"]}

    //console.log(document.getElementById("simulation_shader").textContent)
    particle_position_var_sim = gpuCompute.addVariable("textureVelocity", attractor_shader, particle_texture_sim)

    particle_position_var_sim.wrapS = RepeatWrapping
    particle_position_var_sim.wrapT = RepeatWrapping

    const randomVals = new Float32Array(bufferWidth * bufferHeight) // give each particle a random seed
    for (let i = 0; i < bufferWidth * bufferHeight; i++) {
        randomVals[i] = Math.random() - 0.5
    }

    particle_sim_var_uniforms = particle_position_var_sim.material.uniforms
    particle_sim_var_uniforms["timestep"] = {value:0.1}
    particle_sim_var_uniforms["normalizeFactor"] = {value: parameters["Normalize Factor:"]}

    gpuCompute.setVariableDependencies( particle_position_var, [ particle_position_var, particle_position_var_sim ] )
    gpuCompute.setVariableDependencies( particle_position_var_sim, [ particle_position_var, particle_position_var_sim ] )

    const error = gpuCompute.init()
    if (error !== null) {
        console.error( error )
    }
    gpuCompute.compute()

    //animate()
    renderer.setAnimationLoop(() => {
        scene.add(particle_mesh)
        stats.begin()
        timer = new Date().getTime()
        perlinTick += 1
        particle_position_uniforms["timer"] = {value: timer}
        if(parameters["Fading/Dying:"]){
            //console.log("Faded")
            particle_mat.uniforms["particle_lifetime"] = {value: particle_mat.uniforms["particle_lifetime"].value - 2.0}
            sprite_mat.uniforms["particle_lifetime"] = {value: particle_mat.uniforms["particle_lifetime"].value - 2.0}
        }
        //console.log(particle_mat.uniforms["r"])
        //console.log(particle_mat.uniforms["g"])
        //console.log(particle_mat.uniforms["b"])
        particle_position_uniforms["perlinTick"] = {value: perlinTick}
        gpuCompute.compute()
        //console.log(particle_texture_sim.image)
        //console.log(positionUniforms["timer"])
        updateParticleMesh()
        //console.log(particle_mesh.material)
        renderer.setRenderTarget(null)
        renderer.render(scene, camera)

        stats.end()
    })

}

function dispose_buffers() {
    perlinTick = 0
    buff_geometry.dispose()
    particle_mat.dispose()
    particle_position_var.renderTargets.forEach((rt: WebGLRenderTarget) => {
        rt.texture.dispose()
        rt.dispose()
    })
    particle_position_var_sim.renderTargets.forEach((rt: WebGLRenderTarget) => {
        rt.texture.dispose()
        rt.dispose()
    })
    particle_texture_position.dispose()
}

function fetchAttractorShader() {
    switch(parameters["Attractor"]) {
        case `${velocity_attractors.halvorsenAttractor}`:
            return document.getElementById("halvorsen_attractor_shader").textContent

        case `${velocity_attractors.thomasAttractor}`:
            return document.getElementById("thomas_attractor_shader").textContent

        case `${velocity_attractors.chenAttractor}`:
            return document.getElementById("chen_attractor_shader").textContent

        case `${velocity_attractors.luChenAttractor}`:
            return document.getElementById("lu_chen_attractor_shader").textContent

        case `${velocity_attractors.fourWingAttractor}`:
            return document.getElementById("four_wing_attractor_shader").textContent

        case `${velocity_attractors.layerAttractor}`:
            return document.getElementById("layer_attractor_shader").textContent

        default:
            return document.getElementById("aizawa_attractor_shader").textContent
    }
}

function fetchNoiseShader() {
    switch(parameters["Base Noise Version"]) {
        case `${noise_simulations.simplexNoise}`:
            return document.getElementById("simplex_noise_shader").textContent

        case `${noise_simulations.curlNoise}`:
            return document.getElementById("curl_noise_shader").textContent

        case `${noise_simulations.classicPerlin}`:
            return document.getElementById("position_shader").textContent

        default:
            return document.getElementById("simplex_noise_shader").textContent

    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


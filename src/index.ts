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
    RepeatWrapping,
    Texture,
    DataTexture
} from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import * as Stats from 'stats.js'
import {WEBGL} from "three/examples/jsm/WebGL";
import {GPUComputationRenderer, Variable} from "three/examples/jsm/misc/GPUComputationRenderer";




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
    gpuCompute: GPUComputationRenderer,
    particle_texture_init_position:Texture,
    particle_texture_position:Texture,
    velocity_texture: Texture,
    particle_position_var: Variable,
    velocity_var:Variable,
    positionUniforms,
    velocityUniforms,
    width, height
const bufferHeight = 512
const bufferWidth = 512
const currentMaxVal = 7

particle_mat = new ShaderMaterial({
    uniforms: {
        texturePosition: {
            value: null,
        },
        pointSize: {
            value:  1.0
        }
    },
    vertexShader: `
    uniform sampler2D positions;
    uniform float pointSize;
    void main() {
        //the mesh is a normalized square so the uvs = the xy positions of the vertices
        vec3 pos = texture2D( positions, position.xy ).xyz;

        //pos now contains the position of a point in space taht can be transformed
        gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

        gl_PointSize = pointSize;
    }
  `,
    fragmentShader: `
    void main()
    {
        gl_FragColor = vec4( vec3( 1. ), .25 );
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


    try {
        // @ts-ignore declaration is missing failIfMajorPerformanceCaveat for some reason
        renderer = new WebGLRenderer({antialias: true, failIfMajorPerformanceCaveat: true})
    } catch (err) {
        console.error("Appropriate Hardware Requirements weren't met")
        // todo
    }

    width = window.innerWidth
    height = window.innerHeight


    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor('#1E272C')

    renderer.sortObjects = false

    document.body.appendChild(renderer.domElement)

    //camera = new PerspectiveCamera(35, width / height, 0.1, 3000)
    scene = new Scene()

    light = new AmbientLight(0xffffff,0.5)
    p_light = new PointLight(0xffffff,0.5)
    scene.add(light)
    scene.add(p_light)





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

    const particleNoisePos = noisePositions(bufferWidth, bufferHeight, currentMaxVal)
    gpuCompute = new GPUComputationRenderer(bufferWidth, bufferHeight, renderer)

    particle_texture_position = gpuCompute.createTexture() // (x,y,z) pos + (w) time of life of particle
    particle_texture_init_position = gpuCompute.createTexture()
    //add velocity

    fillPositionTextures(particle_texture_position, particleNoisePos)
    fillPositionTextures(particle_texture_init_position, particleNoisePos)

    particle_position_var = gpuCompute.addVariable("texturePositions", document.getElementById("simulation_shader").textContent, particle_texture_position)

    particle_position_var.wrapS = RepeatWrapping
    particle_position_var.wrapT = RepeatWrapping

    gpuCompute.setVariableDependencies(particle_position_var,[particle_position_var])

    gpuCompute.init()
    gpuCompute.compute()

    //particle positions - normalized
    const p_positions = new Float32Array((width * height) * 3)
    for (let i = 0; i < (width * height); i++) {
        p_positions[i * 3] = (i % width) / width
        p_positions[i * 3 + 1] = (i / width) / height
    }

    buff_geometry = new BufferGeometry()
    buff_geometry.setAttribute('position', new BufferAttribute(p_positions, 3))

    particle_mesh = new Points(buff_geometry, particle_mat)
    scene.add(particle_mesh)

    renderer.setAnimationLoop(() => {

        stats.begin()
        renderer.setRenderTarget(null)
        renderer.render(scene, camera)

        stats.end()
    })
    //requestAnimationFrame(render)





} else {
    const warning = WEBGL.getWebGLErrorMessage()
    document.body.appendChild(warning)
}

function noisePositions(width: number, height: number, maxVal: number): Float32Array {
    let len = width *  height * 4
    const randomData = new Float32Array(len)

    while (len--) {
        randomData[len] = (Math.random() * 2 - 1) * maxVal
    }

    return randomData
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
// function render(){
//     mesh.rotation.x += 0.1
//     mesh.rotation.y += 0.1                                                                                                     ,
//     renderer.render(scene, camera)
//     requestAnimationFrame(render)
// }


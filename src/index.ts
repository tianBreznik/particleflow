import {
    AmbientLight,
    BoxGeometry,
    Fog,
    Mesh,
    MeshBasicMaterial, MeshLambertMaterial,
    PerspectiveCamera, PointLight,
    Scene,
    TOUCH,
    Vector3,
    WebGLRenderer
} from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import * as Stats from 'stats.js'
import {WEBGL} from "three/examples/jsm/WebGL";




let stats
let renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, geometry: BoxGeometry, material:MeshLambertMaterial, mesh:Mesh, light:AmbientLight,p_light:PointLight, width, height


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

    camera = new PerspectiveCamera(35, width / height, 0.1, 3000)
    scene = new Scene()

    light = new AmbientLight(0xffffff,0.5)
    p_light = new PointLight(0xffffff,0.5)
    scene.add(light)
    scene.add(p_light)


    geometry = new BoxGeometry(100,100,100)
    material = new MeshLambertMaterial({color:0xF3FFE2});
    mesh = new Mesh(geometry, material)
    mesh.position.set(0,0,-1000)
    scene.add(mesh)


    //camera = new PerspectiveCamera(60, width / height, 0.00001, 100_000_000)
    //camera.position.copy(new Vector3(50, 150, 250))

    const controls = new OrbitControls(camera, renderer.domElement)
    // TODO tweak
    controls.enablePan = true
    controls.rotateSpeed = 0.5
    controls.enableDamping = true
    controls.dampingFactor = 0.9
    controls.touches = {ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN}
    controls.update()

    requestAnimationFrame(render)




} else {
    const warning = WEBGL.getWebGLErrorMessage()
    document.body.appendChild(warning)
}
function render(){
    mesh.rotation.x += 0.1
    mesh.rotation.y += 0.1                                                                                                     ,
    renderer.render(scene, camera)
    requestAnimationFrame(render)
}


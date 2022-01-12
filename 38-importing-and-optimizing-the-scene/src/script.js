import "./style.css";
import * as dat from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new dat.GUI({
    width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

/**
 * Material
 */
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture,
});

const poleLampMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffe5,
});

const portalMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0.0 },
        uColorStart: { value: new THREE.Color(0x2f075f) },
        uColorEnd: { value: new THREE.Color(0xa2ade2) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
});

gui.addColor(portalMaterial.uniforms.uColorStart, "value").onChange((value) => {
    portalMaterial.uniforms.uColorStart.value = new THREE.Color(value);
});
gui.addColor(portalMaterial.uniforms.uColorEnd, "value").onChange((value) => {
    portalMaterial.uniforms.uColorEnd.value = new THREE.Color(value);
});

/**
 * Model
 */

gltfLoader.load("portal.glb", (gltf) => {
    gltf.scene.traverse((child) => {
        const bakedMesh = gltf.scene.children.find(
            (child) => child.name === "baked"
        );
        const poleLight1 = gltf.scene.children.find(
            (child) => child.name === "poleLightL"
        );
        const poleLight2 = gltf.scene.children.find(
            (child) => child.name === "poleLightR"
        );
        const portal = gltf.scene.children.find(
            (child) => child.name === "portal"
        );
        bakedMesh.material = bakedMaterial;
        poleLight1.material = poleLampMaterial;
        poleLight2.material = poleLampMaterial;
        portal.material = portalMaterial;
    });
    scene.add(gltf.scene);
});

/**
 * Fireflies
 */

const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const positions = new Float32Array(firefliesCount * 3);
const scale = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

    scale[i] = Math.random();
}

firefliesGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
);
firefliesGeometry.setAttribute(
    "aScale",
    new THREE.Float32BufferAttribute(scale, 1)
);

// const firefliesMaterial = new THREE.PointsMaterial({
//     size: 0.1,
//     sizeAttenuation: true,
//     color: 0xffd894,
// });
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100.0 },
        uTime: { value: 0.0 },
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

gui.add(firefliesMaterial.uniforms.uSize, "value", 0, 100);

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio,
        2
    );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    0.1,
    100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

debugObject.clearColor = "#1f2728";
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, "clearColor").onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    portalMaterial.uniforms.uTime.value = elapsedTime;
    firefliesMaterial.uniforms.uTime.value = elapsedTime;
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

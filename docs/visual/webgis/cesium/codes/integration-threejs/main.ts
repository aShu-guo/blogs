import * as Cesium from "cesium";
import * as THREE from 'three';
import {createColoredCube} from "./cube";
import Stats from 'stats.js'
import airlines from './airlines.json'

interface AirlinePoint {
    latitude: number,
    longitude: number,
    height: number
}

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwM2E2NmM4MC05NjdjLTQ2OTMtYWE2My1hODgwNjY3ZTExZTgiLCJpZCI6MzEzMTMsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyIsInByIl0sImlhdCI6MTU5NTIzNzM1Mn0.K4-n5E9TZOEPpkGLwfIQibplnnU88PfrahgHrrrqRDk'

const location = {
    lon: 120.2,
    lat: 29.374215639751842,
    height: 5000
};
const position = Cesium.Cartesian3.fromDegrees(location.lon, location.lat, location.height);

// CesiumJS
const cesiumViewer = new Cesium.Viewer("cesium", {
    // terrainProvider: await Cesium.createWorldTerrainAsync(),
    // useDefaultRenderLoop: false,
    skyBox: false,
    baseLayerPicker: false,
    geocoder: false,
    sceneModePicker: false,
    animation: false,
    timeline: false,
    navigationHelpButton: false,
});
cesiumViewer.scene.debugShowFramesPerSecond = true;
const osmBuildings = await Cesium.createOsmBuildingsAsync();
cesiumViewer.scene.primitives.add(osmBuildings);


// Three.js
const threeContainer = document.getElementById("three");
const threeScene = new THREE.Scene();
const threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 50000000);
const threeRenderer = new THREE.WebGLRenderer({alpha: true});
threeRenderer.setSize(window.innerWidth, window.innerHeight);
threeContainer?.appendChild(threeRenderer.domElement);

var aLight = new THREE.AmbientLight(0xffffff, 0.3);
var dLight = new THREE.DirectionalLight(0xffffff, 1);
dLight.position.set(1000, -100, 900);
threeScene.add(dLight);
threeScene.add(aLight);

const axesHelper = new THREE.AxesHelper(50000000);
threeScene.add(axesHelper);


// Create a cube in Three.js and add it to the scene
const cube = createColoredCube();
cube.position.set(position.x, position.y, position.z);
threeScene.add(cube)

const box = new THREE.Box3();
box.setFromCenterAndSize(new THREE.Vector3(position.x, position.y, position.z), new THREE.Vector3(1000, 1000, 1000));
const helper = new THREE.Box3Helper(box, 0xffff00);
threeScene.add(helper);

const material = new THREE.MeshLambertMaterial({color: '#65EEEF', wireframe: true, transparent: true, opacity: 0.36})
const curve = new THREE.CatmullRomCurve3((airlines as AirlinePoint[]).map(point => {
    const degrees = Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height)
    console.log('>>>:', degrees.x, degrees.y, degrees.z)
    return new THREE.Vector3(degrees.x, degrees.y, degrees.z)
}))
const geometry = new THREE.TubeGeometry(curve, 20, 20, 30, false)
const mesh = new THREE.Mesh(geometry, material)
threeScene.add(mesh)

// Direct the Cesium camera to look at the cube
// cesiumViewer.camera.lookAt(position, new Cesium.Cartesian3(200.0, 500.0, 300.0));
// cesiumViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
cesiumViewer.camera.flyTo({
    destination: position,
    orientation: {
        heading: 6.283185307179586,
        pitch: -0.8004940871228587,
        roll: 0.0
    },
})

function updateThreeJS() {
    // Update Three.js camera field of view to match Cesium camera's vertical FOV
    threeCamera.fov = Cesium.Math.toDegrees(cesiumViewer.camera.frustum.fovy);
    threeCamera.updateProjectionMatrix();

    // Sync Three.js camera with Cesium camera
    const cesiumCamera = cesiumViewer.camera;
    const cvm = cesiumCamera.viewMatrix;
    const civm = cesiumCamera.inverseViewMatrix;

    // Fix the extraction of camera position and direction from matrices
    const cameraPosition = Cesium.Cartesian3.fromElements(civm[12], civm[13], civm[14]);
    const cameraDirection = new Cesium.Cartesian3(-cvm[2], -cvm[6], -cvm[10]);
    const cameraUp = new Cesium.Cartesian3(cvm[1], cvm[5], cvm[9]);

    const cameraPositionVec3 = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    const cameraDirectionVec3 = new THREE.Vector3(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    const cameraUpVec3 = new THREE.Vector3(cameraUp.x, cameraUp.y, cameraUp.z);

    // Update Three.js camera position and orientation
    threeCamera.position.copy(cameraPositionVec3);
    threeCamera.up.copy(cameraUpVec3);
    threeCamera.lookAt(cameraPositionVec3.clone().add(cameraDirectionVec3));

    // Apply rotation to the cube
    cube.rotation.x += 0.01;
    // Render the scene with the updated camera
    threeRenderer.render(threeScene, threeCamera);
};

// Handle window resizing
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    threeRenderer.setSize(width, height);
    threeCamera.aspect = width / height;
    threeCamera.updateProjectionMatrix();
});

function renderLoop() {
    requestAnimationFrame(renderLoop);
    cesiumViewer.render();
    updateThreeJS();

    stats.begin();

    // monitored code goes here

    stats.end();

}

renderLoop();

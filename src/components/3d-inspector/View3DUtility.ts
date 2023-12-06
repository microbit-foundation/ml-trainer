/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable } from 'svelte/store';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// TODO: Why is this a class? No methods mutates object state, and
// only one method uses class state.
// Refacor to pure functions and simply create the loader where needed
class Live3DUtility {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  // TODO: Fix naming
  createSceneWith(array: THREE.Object3D<THREE.Event>[]) {
    return new THREE.Scene().add(...array);
  }

  instantiateRenderer(canvas: HTMLCanvasElement, width: number, height: number) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setClearColor('#ffffff', 0);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.setPixelRatio(window.devicePixelRatio);

    return renderer;
  }

  instantiateLighting() {
    const light1 = new THREE.PointLight(0xffffff, 0.7, 250); // 100, 5000
    light1.position.set(3, 6, 3);
    light1.lookAt(new THREE.Vector3(-3, -6, -3));

    const light2 = new THREE.PointLight(0xffffff, 0.7, 250); // 100, 5000
    light2.position.set(5, 0, 5);
    light2.lookAt(new THREE.Vector3(-5, 0, -5));

    return this.createSceneWith([light1, light2]);
  }

  setupLightingIn(scene: THREE.Scene): void {
    scene.add(this.instantiateLighting());
  }

  instantiateCameraSetup(width: number, height: number, perspective = 85) {
    const camera = new THREE.PerspectiveCamera(perspective, width / height, 0.1, 1000);

    // Position
    camera.position.z = 5;
    camera.position.x = 5;
    camera.position.y = 4;

    // Rotation
    camera.lookAt(new THREE.Vector3(-5, -2, -5));

    return camera;
  }

  /**
   * Apply pose to a mesh
   * @param mesh to which the pose is applied
   * @param pos the new position
   * @param dir the new direction
   */
  applyPose(
    mesh: THREE.Mesh<any, any>, // TODO: Fix any
    pos: THREE.Vector3,
    dir: THREE.Vector3,
  ) {
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.x = this.toRadian(dir.x);
    mesh.rotation.y = this.toRadian(dir.y);
    mesh.rotation.z = this.toRadian(dir.z);
  }

  toRadian(degrees: number) {
    return (degrees / 180) * Math.PI;
  }

  instantiateBar(
    color: THREE.ColorRepresentation,
  ): THREE.Mesh<THREE.CylinderGeometry, THREE.MeshLambertMaterial> {
    const material = new THREE.MeshLambertMaterial({ color });
    const cylinder = new THREE.CylinderGeometry(0.4, 0.4, 2, 16);
    const cylinderMesh = new THREE.Mesh(cylinder, material);
    return cylinderMesh;
  }

  /**
   * Instantiate and add three bars to a scene. Used for visualising three data points in 3D
   * @param scene the scene in which the bars should be added
   * @returns The bars
   */
  setupBarsIn(scene: THREE.Scene): Bars {
    const barX = this.instantiateBar(0xff1515);
    const barY = this.instantiateBar(0x10ff10);
    const barZ = this.instantiateBar(0x2222ff);
    scene.add(barX, barY, barZ);
    this.applyPose(barX, new THREE.Vector3(-4, -5, -5), new THREE.Vector3(0, 0, 90));
    this.applyPose(barY, new THREE.Vector3(-5, -5, -4), new THREE.Vector3(90, 0, 0));
    this.applyPose(barZ, new THREE.Vector3(-5, -4, -5), new THREE.Vector3(0, 90, 0));

    return { barX, barY, barZ };
  }

  async loadMicrobitModel(onProgress?: (event: ProgressEvent<EventTarget>) => void) {
    return new Promise<THREE.Scene>((resolve, reject) => {
      // When loaded. Extract the actual model from the loaded model. Rotate it properly. Resolve.
      const onFinished = (gltf: GLTF) => {
        const model = gltf.scene.children[0].children[0].children[0];
        const group = new THREE.Scene();
        group.add(model);
        model.lookAt(0, 0, 1);
        resolve(group);
      };

      this.loader.load(
        `${import.meta.env.BASE_URL}models/microbit.gltf`,
        onFinished,
        onProgress,
        reject,
      );
    });
  }
}

export type Bars = {
  barX: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshLambertMaterial>;
  barY: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshLambertMaterial>;
  barZ: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshLambertMaterial>;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export default Live3DUtility;

export const graphInspectorState = writable<{
  isOpen: boolean;
  dataPoint: Vector3;
  inspectorPosition: { x: number; y: number };
}>({
  isOpen: false,
  dataPoint: { x: 0, y: 0, z: 0 },
  inspectorPosition: { x: 0, y: 0 },
});

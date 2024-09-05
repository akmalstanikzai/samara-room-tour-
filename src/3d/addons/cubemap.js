import { CubeCamera, RGBFormat, LinearMipmapLinearFilter } from 'three';
import * as THREE from 'three';
import { appState } from '../../services/app-state';
import { params } from '../settings';

export class CubeMap {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  setup() {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    this.cubeCamera = new CubeCamera(0.01, 0.5, cubeRenderTarget);
    this.engine.scene.add(this.cubeCamera);
    this.updateEnvironmentMap();
  }

  updateEnvironmentMap() {
    const pos =
      params.cameras[appState.complectation.value.layout]['kitchen'].position;
    const tar =
      params.cameras[appState.complectation.value.layout]['kitchen'].target;
    this.cubeCamera.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z));
    // this.cubeCamera.target = new THREE.Vector3(tar.x, tar.y, tar.z); // Example target coordinates

    this.cubeCamera.update(this.engine.renderer, this.engine.scene);

    this.envMapTexture = this.cubeCamera.renderTarget.texture;
    this.envMapTexture.mapping = THREE.CubeReflectionMapping;

    this.engine.scene.traverse((mesh) => {
      if (mesh.material && mesh.material.name.includes('Mirror')) {
        mesh.material.envMap = this.envMapTexture;
      }
    });
    this.engine.update();
    this.engine.scene.background = this.cubeCamera.renderTarget.texture;
    this.engine.models.skydome.visible = false;
  }
}

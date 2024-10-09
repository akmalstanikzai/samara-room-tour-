import { params } from './settings';
import lerpFrag from './shaders/lerp/lerp.frag';
import lerpVert from './shaders/lerp/lerp.vert';
import {
  Mesh,
  ShaderMaterial,
  PlaneGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  Color,
} from 'three';

export class Panorama {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  async setup() {
    const geometry = new SphereGeometry(6, 200, 200);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const material = new ShaderMaterial({
      uniforms: {
        texture1: { value: null },
        texture2: { value: null },
        mixRatio: { value: 0.0 },
        ambientLightColor: { value: new Color(0xffffff) },
        ambientLightIntensity: { value: 1.0 },
      },
      vertexShader: lerpVert,
      fragmentShader: lerpFrag,
    });

    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(1);
    mesh.rotation.y = 3.14;
    mesh.name = 'pano';
    mesh.renderOrder = 10;
    this.engine.panoMesh = mesh;
    this.engine.scene.add(mesh);
    // this.engine.models.centerModels(mesh);
  }
}

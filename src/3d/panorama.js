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
    this.name = 'pano';
  }

  async setup() {
    this.items = [
      {
        name: 'Sprite_pano1',
        cameraMap: '360_Bathroom_01',
        textureMap: '241002_samara_360 Bathroom 01',
        position: {
          x: params.cameras.studio['360_Bathroom_01'].position.x,
          y: params.cameras.studio['360_Bathroom_01'].position.y,
          z: params.cameras.studio['360_Bathroom_01'].position.z,
        },
      },
      {
        name: 'Sprite_pano2',
        cameraMap: '360_Living_02',
        textureMap: '241002_samara_360 Living 02',
        position: {
          x: params.cameras.studio['360_Living_02'].position.x,
          y: params.cameras.studio['360_Living_02'].position.y,
          z: params.cameras.studio['360_Living_02'].position.z,
        },
      },

      {
        name: 'Sprite_pano3',
        cameraMap: '360_Entry_01',
        textureMap: '241002_samara_360 Entry 01',
        position: {
          x: params.cameras.studio['360_Entry_01'].position.x,
          y: params.cameras.studio['360_Entry_01'].position.y,
          z: params.cameras.studio['360_Entry_01'].position.z,
        },
      },

      {
        name: 'Sprite_pano4',
        cameraMap: '360_Living_01',
        textureMap: '241002_samara_360 Living 01',
        position: {
          x: params.cameras.studio['360_Living_01'].position.x,
          y: params.cameras.studio['360_Living_01'].position.y,
          z: params.cameras.studio['360_Living_01'].position.z,
        },
      },

      {
        name: 'Sprite_pano5',
        cameraMap: '360_Living_03',
        textureMap: '241002_samara_360 Living 03',
        position: {
          x: params.cameras.studio['360_Living_03'].position.x,
          y: params.cameras.studio['360_Living_03'].position.y,
          z: params.cameras.studio['360_Living_03'].position.z,
        },
      },

      {
        name: 'Sprite_pano6',
        cameraMap: '360_Bedroom_01',
        textureMap: '241002_samara_360 Bedroom 01',
        position: {
          x: params.cameras.studio['360_Bedroom_01'].position.x,
          y: params.cameras.studio['360_Bedroom_01'].position.y,
          z: params.cameras.studio['360_Bedroom_01'].position.z,
        },
      },
    ];

    this.items.forEach((pano) => {
      const sprite = new Mesh(
        new PlaneGeometry(0.1, 0.1),
        new MeshBasicMaterial({
          map: this.engine.textures.getTexture('pin'),
          transparent: true,
          depthTest: false,
        })
      );

      sprite.rotation.x = -Math.PI / 2;
      sprite.visible = false;
      sprite.position.copy(pano.position);
      sprite.name = pano.name;
      sprite.position.y = -0.2;
      sprite.scale.setScalar(2);
      sprite.renderOrder = 10;
      this.engine.scene.add(sprite);
      this.engine.meshes.push(sprite);
    });

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
  }

  toggleVisibility(name = this.name === 'pano' ? '3d' : 'pano') {
    this.name = name;
    const mesh = this.engine.scene.getObjectByName('pano');
    if (mesh) {
      if (name === 'pano') {
        mesh.visible = true;
        this.engine.models.visible = false;
      }

      if (name === '3d') {
        mesh.visible = false;
        this.engine.models.visible = true;
      }
    }
  }
}

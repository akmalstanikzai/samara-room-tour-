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

export class Sprites {
  constructor(engine) {
    this.engine = engine;
    this.setup();
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
          // depthTest: false,
          opacity: 0.5,
        })
      );

      sprite.rotation.x = -Math.PI / 2;
      sprite.visible = false;
      sprite.position.copy(pano.position);
      sprite.name = pano.name;
      sprite.position.y = this.engine.models.group.box.min.y + 0.6;
      sprite.scale.setScalar(3.25);
      sprite.renderOrder = 10;
      this.engine.scene.add(sprite);
      this.engine.meshes.push(sprite);
    });
  }
}

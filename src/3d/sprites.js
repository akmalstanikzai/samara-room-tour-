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
    params.pano().forEach((pano) => {
      const sprite = new Mesh(
        new PlaneGeometry(0.1, 0.1),
        new MeshBasicMaterial({
          map: this.engine.textures.getTexture('pin'),
          transparent: true,
          // depthTest: false,
          opacity: 0.3,
        })
      );

      sprite.rotation.x = -Math.PI / 2;
      sprite.visible = false;
      sprite.position.copy(pano.position);
      sprite.name = pano.name;
      sprite.position.y = this.engine.models.group.box.min.y + 0.6;
      sprite.scale.setScalar(3.25);
      sprite.renderOrder = 0;
      this.engine.scene.add(sprite);
      this.engine.meshes.push(sprite);
    });
  }
}

import { Mesh, ShaderMaterial, PlaneGeometry, MeshBasicMaterial } from 'three';

export class Hotspots {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  async setup() {
    this.engine.pano.panoItems.forEach((pano) => {
      const hotspot = new Mesh(
        new PlaneGeometry(0.1, 0.1),
        new MeshBasicMaterial({
          name: 'Hotspot',
          map: this.engine.textures.getTexture('pin'),
          transparent: true,
          // depthTest: false,
          opacity: 0.3,
        })
      );

      hotspot.rotation.x = -Math.PI / 2;
      hotspot.position.copy(pano.position);
      hotspot.position.y = this.engine.models.group.box.min.y + 0.6;
      hotspot.scale.setScalar(3.25);
      hotspot.renderOrder = 0;
      hotspot.name = `Hotspot_${pano.name}`;
      this.engine.scene.add(hotspot);
      this.engine.meshes.push(hotspot);
    });
  }

  update() {}
}

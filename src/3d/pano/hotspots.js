import { Vector2, Raycaster, MathUtils, DoubleSide } from 'three';
import { Mesh, ShaderMaterial, PlaneGeometry, MeshBasicMaterial } from 'three';
import { params } from '../settings';
import { Vector3 } from 'three';

export class Hotspots {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  async setup() {
    this.popup = this.createPopup(); // Create the popup element
    this.vector = new Vector3();
    this.engine.pano.panoItems.forEach((pano) => {
      const hotspot = new Mesh(
        new PlaneGeometry(0.4, 0.4),
        new MeshBasicMaterial({
          name: 'Hotspot',
          map: this.engine.textures.getTexture('pin'),
          transparent: true,
          // depthTest: false,
          opacity: 0.5,
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

    this.engine.pano.infospots.forEach((item) => {
      const object3d = this.engine.scene.getObjectByName(item.name);

      const infoHotspot = new Mesh(
        new PlaneGeometry(0.4, 0.4),
        new MeshBasicMaterial({
          map: this.engine.textures.getTexture('i'),
          transparent: true,
          opacity: 1,
          side: DoubleSide,
        })
      );

      object3d.getWorldPosition(infoHotspot.position);

      infoHotspot.name = 'Info' + MathUtils.generateUUID();
      infoHotspot._info = item.info;

      // infoHotspot.rotation.z = -Math.PI;
      infoHotspot.material.map.flipY = true;
      infoHotspot.scale.setScalar(1.25);
      infoHotspot.position.z += 0.01;
      this.engine.scene.add(infoHotspot);
      this.engine.meshes.push(infoHotspot);
    });
  }

  createPopup() {
    const popup = document.createElement('div');
    popup.id = 'popup';
    popup.style.display = 'none';
    popup.style.position = 'absolute';
    popup.style.background = 'rgba(255, 255, 255, 0.6)';
    popup.style.color = 'black';
    popup.style.borderRadius = '8px';
    popup.style.padding = '10px';
    popup.style.backdropFilter = 'blur(1em)';
    popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popup.style.pointerEvents = 'none';
    params.container.appendChild(popup);
    return popup;
  }

  showPopup(object) {
    this.popup.innerText = object._info;
    this.popup.style.display = 'block';

    const width = params.container.clientWidth;
    const height = params.container.clientHeight;

    object.updateWorldMatrix(true, false);
    object.getWorldPosition(this.vector);

    this.vector.project(this.engine.camera);

    const x = (this.vector.x * 0.5 + 0.5) * width;
    const y = (this.vector.y * -0.5 + 0.5) * height; // Invert y for correct positioning

    this.popup.style.left = `${x - this.popup.clientWidth / 2}px`;
    this.popup.style.top = `${y - this.popup.clientHeight - 10}px`;
  }

  hidePopup() {
    this.popup.style.display = 'none';
  }

  update() {}
}

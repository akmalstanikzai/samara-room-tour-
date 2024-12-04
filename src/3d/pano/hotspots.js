import {
  Vector2,
  Raycaster,
  MathUtils,
  DoubleSide,
  SpriteMaterial,
} from 'three';
import { Mesh, ShaderMaterial, PlaneGeometry, MeshBasicMaterial } from 'three';
import { params } from '../settings';
import { Vector3 } from 'three';
import { Sprite } from 'three';

export class Hotspots {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  async setup() {
    this.vector = new Vector3();
    this.engine.pano.panoItems.forEach((pano) => {
      const hotspot = new Mesh(
        new PlaneGeometry(0.4, 0.4),
        new MeshBasicMaterial({
          name: 'Hotspot',
          map: this.engine.textures.getTexture('Hotspot'),
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

      const infoSpot = new Sprite(
        new SpriteMaterial({
          map: this.engine.textures.getTexture('i'),
          transparent: true,
          opacity: 1,
        })
      );

      // object3d.getWorldPosition(infoSpot.position);
      infoSpot.position.copy(item.position);

      infoSpot.name = 'Info' + MathUtils.generateUUID();
      infoSpot._bubbleText = item.bubbleText;

      // infoSpot.rotation.z = -Math.PI;
      infoSpot.material.map.flipY = true;
      infoSpot.scale.setScalar(0.5);
      infoSpot.position.z += 0.01;
      this.engine.scene.add(infoSpot);
      this.engine.meshes.push(infoSpot);
    });
  }

  updatePopupPosition() {
    if (this.object && params.popup) {
      const width = params.container.clientWidth;
      const height = params.container.clientHeight;
      this.object.updateWorldMatrix(true, false);
      this.object.getWorldPosition(this.vector);

      this.vector.project(this.engine.camera);

      const x = (this.vector.x * 0.5 + 0.5) * width;
      const y = (this.vector.y * -0.5 + 0.5) * height; // Invert y for correct positioning

      this.vector.z < 0.995
        ? (params.popup.style.display = 'block')
        : (params.popup.style.display = 'none');

      params.popup.style.left = `${x - params.popup.clientWidth / 2}px`;
      params.popup.style.top = `${y - params.popup.clientHeight - 10}px`;
    }
  }

  /**
   * Gets the position of the hotspot in screen coordinates.
   * This method calculates the position based on the current
   * object's world position and the camera's projection.
   * The resulting coordinates will be used for positioning
   * the bubble text associated with the hotspot.
   *
   * @param {Object} object - The object for which to show the popup.
   *                          This should be the hovered object marked 'i'.
   *
   * @returns {Vector2} The screen coordinates of the hotspot.
   */
  get hotspotPosition() {
    if (this.object) {
      const width = params.container.clientWidth;
      const height = params.container.clientHeight;
      this.object.updateWorldMatrix(true, false);
      this.object.getWorldPosition(this.vector);

      this.vector.project(this.engine.camera);

      const x = (this.vector.x * 0.5 + 0.5) * width;
      const y = (this.vector.y * -0.5 + 0.5) * height;

      return new Vector2(x, y);
    }
  }

  showPopup(object) {
    if (params.popup) {
      params.popup.innerText = object._bubbleText;
      params.popup.style.display = 'block';
    }

    this.object = object;
    this.updatePopupPosition();
  }

  hidePopup() {
    if (params.popup) {
      params.popup.style.display = 'none';
    }
    this.object = null;
  }

  update() {}
}

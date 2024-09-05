import { PlaneHelper } from 'three';
import { Plane, Quaternion, Vector3 } from 'three';

export class Plan {
  constructor(engine) {
    this.engine = engine;
  }

  init() {
    this.topPlane = new Plane(new Vector3(-1, 0, 0), 0.2);

    this.engine.renderer.localClippingEnabled = true;
    this.engine.renderer.clippingPlanes = Object.freeze([]);

    this.topPlane.normal.set(2.220446049250313e-16, -1.1499999999999997, 0);

    this.initialized = true;
    this.cut = false;
  }

  /**
   * @param {Boolean} cut
   */

  cutTop(cut = !this.cut) {
    if (!this.initialized) this.init();
    this.engine.scene.traverse((mesh) => {
      if (mesh.material) {
        mesh.material.clippingPlanes = cut ? [this.topPlane] : [];
        mesh.material.clipIntersection = cut;
      }
    });
    this.cut = !this.cut;
  }
}

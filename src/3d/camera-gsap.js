import { Vector3 } from 'three';
import { gsap, Power0, Linear, Power4, Power3 } from 'gsap';
import { params } from './settings';
import { appState } from '../services/app-state';

/** Class for smooth camera transitions with gsap. */

class CameraGsap {
  constructor() {
    this.targetIndex = 0;
    this.engine = window.engine;
  }

  /**
   * Make an orbit with given points
   * @param {number} positionX Camera position x.
   * @param {number} positionY  Camera position y.
   * @param {number} positionZ  Camera position z.
   * @param {number} targetX  Orbit center position x.
   * @param {number} targetY  Orbit center position y.
   * @param {number} targetZ  Orbit center position z.
   * @param {number} animationTime  Animation time
   */

  setLookAt(
    positionX,
    positionY,
    positionZ,
    targetX,
    targetY,
    targetZ,
    animationTime
  ) {
    const targetA = this.engine.controls.getTarget();
    const targetB = {
      x: targetX,
      y: targetY,
      z: targetZ,
    };

    const positionA = this.engine.controls.getPosition();
    const positionB = { x: positionX, y: positionY, z: positionZ };
    const obj = {
      t: 0,
    };

    const tl = gsap.timeline();
    tl.to(obj, {
      t: 1,
      duration: animationTime,
      onStart: () => {
        appState.renderingStatus.next(true);
      },
      onComplete: () => {
        this.engine.controls.enabled = true;
        appState.renderingStatus.next(false);
      },
      onUpdate: () => {
        appState.renderingStatus.next(true);
        const progress = tl.progress();

        this.engine.controls.enabled = false;

        this.engine.controls.lerpLookAt(
          positionA.x,
          positionA.y,
          positionA.z,
          targetA.x,
          targetA.y,
          targetA.z,
          positionB.x,
          positionB.y,
          positionB.z,
          targetB.x,
          targetB.y,
          targetB.z,
          progress,
          true
        );
      },
    });
    this.engine.update();
    return tl;
  }

  /**
   * Function to get controls
   */

  getControls() {
    return this.engine.controls;
  }

  /**
   * Moves camera to specified position
   * @param {string} positionName  'front', 'left', 'roof' Optional (moves camera to named position)
   * @param {boolean} animate Whether to animate the camera movement (default is true)
   */

  async setPosition(positionName, animate = true) {
    const positionA = this.engine.controls.getPosition();
    const positionB = params.cameras[positionName].position;

    const deviation = 0.05;

    if (
      Math.abs(positionA.x - positionB.x) <= deviation &&
      Math.abs(positionA.y - positionB.y) <= deviation &&
      Math.abs(positionA.z - positionB.z) <= deviation
    ) {
      return 'Positions are same';
    }

    const obj = {
      t: 0,
    };
    const targetA = this.engine.controls.getTarget();
    const targetB = params.cameras[positionName].target;

    const tl = gsap.timeline();
    tl.to(obj, {
      t: 1,
      duration: !animate ? 0.01 : 0.3,
      onStart: () => {
        appState.renderingStatus.next(true);
      },
      onComplete: () => {
        this.engine.controls.enabled = true;
        appState.renderingStatus.next(false);
      },
      onUpdate: () => {
        appState.renderingStatus.next(true);
        const progress = tl.progress();

        this.engine.controls.enabled = false;

        this.engine.controls.lerpLookAt(
          positionA.x,
          positionA.y,
          positionA.z,
          targetA.x,
          targetA.y,
          targetA.z,
          positionB.x,
          positionB.y,
          positionB.z,
          targetB.x,
          targetB.y,
          targetB.z,
          progress,
          animate
        );
      },
    });
    this.engine.update();
    return tl;
  }

  /**
   * Sets the default camera position based on the current layout.
   */

  setDefaultCam() {
    const camera = params.models.samara.complectationVars.Layout.variants.find(
      (variant) => variant.name === appState.complectation.value.layout
    ).camera;
    const position = params.cameras[camera].position;
    appState.cam.next('outside');
    this.engine.cameraControls.setThirdPersonParams();
    this.engine.controls.zoomTo(params.controls.thirdPerson.defaultZoom);
    this.engine.controls.setLookAt(position.x, position.y, position.z, 0, 0, 0);
  }

  setCam(name) {
    if (name === 'outside') {
      this.engine.cursor.pin.visible = false;

      this.engine.plan.cutTop(false);

      params.postProcessing.enabled = false;
      this.engine.cameraControls.setThirdPersonParams();
      this.engine.controls.zoomTo(params.controls.thirdPerson.defaultZoom);

      this.engine.controls.setTarget(0, 0, 0);

      const camera =
        appState.complectation.value.layout === 'XL 8' ? 'right' : 'front';
      const pos = params.cameras[camera].position;
      appState.cam.next('outside');

      this.engine.controls.setPosition(pos.x, pos.y, pos.z);
      this.engine.controls.enabled = true;
      this.engine.panorama.toggleVisibility('3d');
      this.engine.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = false;
        }
      });
      this.engine.labels.divs.forEach((div) => {
        div.style.visible = false;
      });
    } else if (name === 'floor plan') {
      this.engine.cursor.pin.visible = false;

      this.engine.plan.cutTop(true);

      appState.cam.next('floor plan');

      params.postProcessing.enabled = false;
      this.engine.controls.enabled = false;
      this.engine.cameraControls.setThirdPersonParams();
      this.engine.controls.zoomTo(params.controls.thirdPerson.defaultZoom);

      this.engine.controls.setTarget(0, 0, 0);
      this.engine.plan.cutTop(true);

      const pos = params.cameras['floor plan'].position;

      this.engine.controls.setPosition(pos.x, pos.y, pos.z);
      this.engine.panorama.toggleVisibility('3d');
      this.engine.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = false;
        }
      });
      this.engine.labels.divs.forEach((div) => {
        div.style.visible = true;
      });
    } else {
      this.engine.plan.cutTop(false);
      this.engine.cursor.pin.visible = true;

      params.postProcessing.enabled = true;
      this.engine.controls.enabled = true;

      this.engine.cameraControls.setFirstPersonParams();
      this.engine.controls.zoomTo(params.controls.firstPerson.defaultZoom);

      const cam = params.cameras[appState.complectation.value.layout][name];
      appState.cam.next(name);

      this.engine.controls.setLookAt(
        cam.position.x,
        cam.position.y,
        cam.position.z,
        cam.target.x,
        cam.target.y,
        cam.target.z
      );

      const pano = this.engine.scene.getObjectByName('pano');

      const textureMap = this.engine.panorama.items.find(
        (pano) => pano.cameraMap === name
      ).textureMap;
      const texture = this.engine.textures.getTexture(textureMap);
      texture.flipY = true;
      pano.material.map = texture;
      this.engine.panorama.toggleVisibility('pano');

      this.engine.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = true;
        }
      });
      this.engine.labels.divs.forEach((div) => {
        div.style.visible = false;
      });
    }

    this.engine.update();
  }

  async move(x, z, distanceFromCameraToObject) {
    const positionA = this.engine.controls.getPosition();

    const positionB = { x: x, y: positionA.y, z: z };

    const targetA = this.engine.controls.getTarget();
    const targetB = {
      x: x,
      y: positionB.y,
      z: z,
    };

    const obj = {
      t: 0,
      x: positionA.x,
      y: positionA.y,
      z: positionA.z,
      tarX: targetA.x,
      tarY: targetA.y,
      tarZ: targetA.z,
    };

    this.moveGsap = gsap.timeline().to(obj, {
      duration: params.animation.move.duration,
      ease: params.animation.move.ease,
      t: 1,
      x: positionB.x,
      y: positionB.y,
      z: positionB.z,
      tarX: targetB.x,
      tarY: targetB.y,
      tarZ: targetB.z,
      onStart: () => {
        this.engine.postprocessing.motionBlur.intensity =
          params.animation.blur.intensity;
      },
      onComplete: () => {
        appState.renderingStatus.next(false);
      },
      onUpdate: () => {
        this.engine.controls.moveTo(obj.x, obj.y, obj.z, false);
        appState.renderingStatus.next(true);
      },
    });
    return await this.moveGsap;
  }
}

export { CameraGsap };

import { Vector3 } from 'three';
import { gsap, Power0, Linear, Power4, Power3 } from 'gsap';
import { params } from './settings';
import { appState } from '../services/app-state';
import { delayMs } from '../utils/delay';
import * as THREE from 'three';

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

  setCam(name, move) {
    if (name === 'outside') {
      // this.engine.cursor.pin.visible = false;

      this.engine.plan.cutTop(false);

      this.engine.cameraControls.setThirdPersonParams();
      this.engine.controls.zoomTo(params.controls.thirdPerson.defaultZoom);

      this.engine.controls.setTarget(0, 0, 0);

      const camera =
        appState.complectation.value.layout === 'XL 8' ? 'right' : 'front';
      const pos = params.cameras[camera].position;
      appState.cam.next('outside');
      params.postProcessing.enabled = false;
      this.engine.ambientLight.intensity = 1;

      this.engine.controls.setPosition(pos.x, pos.y, pos.z);
      this.engine.controls.enabled = true;
      this.engine.panorama.toggleVisibility('3d');
      this.engine.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = false;
        }
      });
      this.engine.labels.labels.forEach((label) => {
        label.visible = false;
      });
    } else if (name === 'floor plan') {
      params.postProcessing.enabled = true;
      this.engine.ambientLight.intensity = Math.PI;
      // this.engine.cursor.pin.visible = false;

      this.engine.plan.cutTop(true);

      appState.cam.next('floor plan');

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
      this.engine.labels.labels.forEach((label) => {
        label.visible = true;
      });
    } else {
      params.postProcessing.enabled = true;
      this.engine.ambientLight.intensity = Math.PI;
      this.engine.plan.cutTop(false);
      // this.engine.cursor.pin.visible = true;

      this.engine.controls.enabled = true;

      this.engine.cameraControls.setFirstPersonParams();
      this.engine.controls.zoomTo(params.controls.firstPerson.defaultZoom);

      this.engine.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = true;
        }
      });

      this.engine.labels.labels.forEach((label) => {
        label.visible = true;
      });

      if (move) {
        this.move(name);
      } else {
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
        pano.material.uniforms.texture1.value = texture;
        pano.material.uniforms.texture2.value = texture;
        this.engine.panorama.toggleVisibility('pano');

        const { x, z } = params.cameras.studio[name].position;
        const positionA = this.engine.controls.getPosition();
        const positionB = { x: x, y: positionA.y, z: z };

        this.engine.panoMesh.position.copy(positionB);
      }
    }

    this.engine.update();
  }

  async move(name) {
    const material = this.engine.scene.getObjectByName('pano').material;

    const currentTextureMap = material.uniforms.texture1.value;

    const { x, z } = params.cameras.studio[name].position;
    const positionA = this.engine.controls.getPosition();
    const positionB = { x: x, y: positionA.y, z: z };
    const targetA = this.engine.controls.getTarget();
    const targetB = { x: x, y: positionB.y, z: z };

    const obj = {
      x: positionA.x,
      y: positionA.y,
      z: positionA.z,
      blend: 0,
    };

    // this.engine.controls.moveTo(positionB.x, positionB.y, positionB.z, true);

    !this.moveGsap && (this.moveGsap = gsap.timeline());

    if (this.moveGsap.isActive()) return;
    this.moveGsap.to(obj, {
      duration: params.animation.move.duration,
      ease: params.animation.move.ease,
      blend: 1,
      x: positionB.x,
      y: positionB.y,
      z: positionB.z,
      onStart: () => {
        const nextTextureMap = this.engine.textures.getTexture(
          this.engine.panorama.items.find((pano) => pano.cameraMap === name)
            .textureMap
        );
        material.uniforms.texture2.value = nextTextureMap;
        this.engine.panoMesh.position.copy(positionB);
      },
      onComplete: () => {
        appState.renderingStatus.next(false);
        appState.cam.next(name);
        material.uniforms.texture1.value = material.uniforms.texture2.value;
        material.uniforms.mixRatio.value = 0; // Set mixRatio to 1 at the end
      },
      onUpdate: () => {
        // this.engine.cursor.pin.visible = false;
        this.engine.controls.moveTo(obj.x, obj.y, obj.z, false);

        // console.log(material.uniforms.mixRatio.value);

        const progress = this.moveGsap.progress();

        if (progress >= 0.5) {
          // Start updating blend from 0.5 to 1 progress
          const blendProgress = (progress - 0.5) * 2; // Map 0.5-1 to 0-1
          material.uniforms.mixRatio.value = blendProgress;
        }
      },
    });

    return this.moveGsap;
  }
}

export { CameraGsap };

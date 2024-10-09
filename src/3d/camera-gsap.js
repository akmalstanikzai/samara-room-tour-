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
    this.moveGsap = gsap.timeline();
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
        // this.engine.controls.enabled = false;
        appState.renderingStatus.next(true);
      },
      onComplete: () => {
        this.engine.controls.enabled = true;
        appState.renderingStatus.next(false);
      },
      onUpdate: () => {
        appState.renderingStatus.next(true);
        const progress = tl.progress();
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

  async setCam(name, firstInit) {
    if (this.moveGsap.isActive()) return;
    const material = this.engine.panoMesh.material;

    const { position, target } = params.cameras.studio[name];
    const positionA = this.engine.controls.getPosition();
    const positionB = { x: position.x, y: position.y, z: position.z };
    const targetA = this.engine.controls.getTarget();
    const targetB = { x: target.x, y: target.y, z: target.z };

    if (firstInit) {
      this.engine.controls.setLookAt(
        positionB.x,
        positionB.y,
        positionB.z,
        targetB.x,
        targetB.y,
        targetB.z
      );
    }

    const obj = {
      x: positionA.x,
      y: positionA.y,
      z: positionA.z,
      blend: 0,
    };

    this.moveGsap.to(obj, {
      duration: firstInit ? 0.01 : params.animation.move.duration,
      ease: params.animation.move.ease,
      blend: 1,
      x: positionB.x,
      y: positionB.y,
      z: positionB.z,
      onStart: () => {
        const nextTextureMap = this.engine.textures.getTexture(
          this.engine.sprites.items.find((pano) => pano.cameraMap === name)
            .textureMap
        );
        material.uniforms.texture2.value = nextTextureMap;
        this.engine.panoMesh.position.copy(positionB);
      },
      onComplete: () => {
        appState.renderingStatus.next(false);
        appState.cam.next(name);
        material.uniforms.texture1.value = material.uniforms.texture2.value;
        material.uniforms.mixRatio.value = 0;
      },
      onUpdate: () => {
        // this.engine.cursor.pin.visible = false;
        this.engine.controls.moveTo(obj.x, obj.y, obj.z, true);

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

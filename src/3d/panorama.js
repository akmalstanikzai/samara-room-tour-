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
  Vector3,
} from 'three';
import { gsap, Power0, Linear, Power4, Power3 } from 'gsap';
import { appState } from '../services/app-state';
import { CursorPin } from './cursor';
import { Hotspots } from './hotspots';

export class Panorama {
  constructor(engine) {
    this.engine = engine;
    this.moveGsap = gsap.timeline();
    this.setup();
    this.hotspots = new Hotspots(this.engine);
    this.cursor = new CursorPin(this.engine);
    this.mouseDownPosition = null;
    this.mouseMoveThreshold = 5; // pixels
    this.listeners = [
      {
        eventTarget: params.container,
        eventName: 'mousemove',
        eventFunction: (e) => {
          this.cursor.onMove(e);
          if (this.mouseDownPosition) {
            const dx = e.clientX - this.mouseDownPosition.x;
            const dy = e.clientY - this.mouseDownPosition.y;
            if (Math.sqrt(dx * dx + dy * dy) > this.mouseMoveThreshold) {
              this.mouseDownPosition = null;
            }
          }
        },
      },
      {
        eventTarget: params.container,
        eventName: 'mousedown',
        eventFunction: (e) => {
          this.mouseDownPosition = { x: e.clientX, y: e.clientY };
        },
      },
      {
        eventTarget: params.container,
        eventName: 'mouseup',
        eventFunction: (e) => {
          if (this.mouseDownPosition) {
            this.cursor.onClick(e);
          }
          this.mouseDownPosition = null;
        },
      },
    ];
  }

  async setup() {
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
    // this.engine.models.centerModels(mesh);
  }

  async move(name, firstInit) {
    if (this.moveGsap.isActive()) return;

    if (!this.cameraPositions) {
      this.cameraPositions = {};

      params.pano.forEach((pano) => {
        this.cameraPositions[pano.name] = {
          position: new Vector3().copy(pano.position),
          target: new Vector3(pano.target.x, pano.target.y, pano.target.z),
        };
      });
    }

    const material = this.engine.panoMesh.material;

    const { position: positionB, target: targetB } = this.cameraPositions[name];
    const positionA = this.engine.controls.getPosition();
    // const targetA = this.engine.controls.getTarget();

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
          params.pano.find((pano) => pano.name === name).textureMap
        );
        material.uniforms.texture2.value = nextTextureMap;
        this.engine.panoMesh.position.copy(positionB);

        this.engine.scene.traverse((object) => {
          if (object.name.includes('Hotspot')) {
            object.visible = false;
          }
        });
        params.pano.forEach((pano) => {
          if (pano.name === name) {
            pano.visible.forEach((item) => {
              const object = this.engine.scene.getObjectByName(
                `Hotspot_${item}`
              );
              object.visible = true;
            });
          }
        });
      },
      onComplete: () => {
        appState.renderingStatus.next(false);
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

  update() {
    this.cursor && this.cursor.update();
    this.hotspots && this.hotspots.update();
  }
}

const EPS = 0.000011177461712 * 0.0001;

export const createPanoItem = (name, textureMap, visible) => ({
  name,
  textureMap,
  get position() {
    return window.engine.scene
      .getObjectByName(name)
      .getWorldPosition(new Vector3());
  },
  get target() {
    const { x, y, z } = this.position;
    return {
      x: x + EPS * 15,
      y: y + EPS * 0.0001,
      z: z - EPS,
    };
  },
  visible,
});

export const createTextureObject = (textureMap) => ({
  path: `${textureMap}.webp`,
  name: textureMap,
  anisotropy: true,
  filter: true,
  flip: true,
});

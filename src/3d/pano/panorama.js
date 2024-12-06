import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Color,
  Vector3,
  Layers,
} from 'three';
import { params } from '../settings';
import lerpFrag from './shaders/lerp/lerp.frag';
import lerpVert from './shaders/lerp/lerp.vert';
import { gsap, Power0, Linear, Power4, Power3 } from 'gsap';
import { appState } from '../../services/app-state';
import { Cursor } from './cursor';
import { Hotspots } from './hotspots';
import { loadGltf } from '../model-loader';

const EPSILON = 1.1177461712e-10;

/**
 * @typedef {Object} Hotspot
 * @property {string} name - The name of the hotspot.
 * @property {string} textureMap - The path to the texture map for the hotspot.
 * @property {Array<string>} visible - An array of names of visible items associated with the hotspot.
 * @property {string} [depthMap] - The path to the depth map for the hotspot (optional).
 */

/**
 * @typedef {Object} PanoData
 * @property {Hotspot[]} hotspots - An array of hotspots for the panorama.
 * @property {Array} infospots - An array of infospots associated with the panorama.
 * @property {string} model - The path to the model associated with the panorama.
 */

/**
 * @typedef {Object} PanoItems
 * @property {PanoData} "1B" - The panorama data for the identifier "1B".
 * @property {Array<{ textureMap: string }>} textures - An array of texture objects.
 */

/** Panorama */
export class Panorama {
  constructor(engine) {
    this.engine = engine;
    this.moveGsap = gsap.timeline();

    this.mouseDownPosition = null;
    this.mouseMoveThreshold = 5; // pixels
  }

  get listeners() {
    return [
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
          params.container.classList.add('cursor-dragging');
          this.mouseDownPosition = { x: e.clientX, y: e.clientY };
        },
      },
      {
        eventTarget: params.container,
        eventName: 'mouseup',
        eventFunction: (e) => {
          params.container.classList.remove('cursor-dragging');
          params.container.classList.add('cursor-grab');
          if (this.mouseDownPosition) {
            this.cursor.onClick(e);
          }
          this.mouseDownPosition = null;
        },
      },
      {
        eventTarget: params.container,
        eventName: 'dblclick',
        eventFunction: (e) => {
          this.cursor.onDoubleClick(e);
        },
      },
    ];
  }

  async setup() {
    try {
      // Fetching panoItems.json which contains information about panoramas and their associated assets
      /** @type {PanoItems} */
      const [panoItems, config] = await Promise.all([
        fetch(`${params.paths.assets_path}panoItems.json`).then((r) =>
          r.json()
        ),
        fetch(`${params.paths.assets_path}config.json`).then((r) => r.json()),
      ]);

      this.applyConfig(config);

      this.panoItems = panoItems['1B'].hotspots.map(
        ({
          name,
          textureMap,
          depthMap,
          visibleHotspots,
          visibleInfospots,
          position,
        }) =>
          this.createPanoItem(
            name,
            textureMap,
            depthMap,
            visibleHotspots,
            visibleInfospots,
            position
          )
      );

      this.infospots = panoItems['1B'].infospots;

      const newTextureObjects = [
        ...this.panoItems.flatMap(({ textureMap, depthMap }) => [
          this.createTextureObject(textureMap),
          depthMap ? this.createTextureObject(depthMap) : null,
        ]),
        ...(config.textures || []).map(({ textureMap }) =>
          this.createTextureObject(textureMap)
        ),
      ].filter(Boolean);

      await Promise.all(
        newTextureObjects.map(async (texture) => {
          await this.engine.textures.loadTexture(texture, 'map');
        })
      );

      params.textures.push(...newTextureObjects);
      this.engine.meshes = [];

      const model = await loadGltf(
        `${params.paths.assets_path + panoItems['1B'].model}`,
        params.paths.decoders_path
      );

      model.scene.children.forEach((child) => {
        child.children.forEach((object) => {
          if (object.material) {
            if (object.material.name === 'Tables') {
              object.material.colorWrite = false;
              object.renderOrder = 1000;
            } else if (object.material.name === 'Interior') {
              object.material.colorWrite = false;
              object.renderOrder = 1000;
            } else {
              object.visible = false;
              object.renderOrder = 10;
            }
          }
          this.engine.models.group.add(object.clone());
        });
      });

      this.engine.models.group.box = this.engine.models.computeBoundingBox(
        this.engine.models.group
      );

      this.engine.scene.traverse((object) => {
        if (object instanceof Mesh && object.material)
          this.engine.meshes.push(object);
      });
    } catch (error) {
      console.error('Error loading panoItems.json:', error);
    }

    const geometry = new SphereGeometry(30, 200, 200);
    geometry.scale(-1, 1, 1);

    const material = new ShaderMaterial({
      uniforms: {
        texture1: { value: null },
        texture2: { value: null },
        mixRatio: { value: 0.0 },
        ambientLightColor: { value: new Color(0xffffff) },
        ambientLightIntensity: { value: 1.0 },
        displacementMap: { value: null },
        displacementScale: { value: 1.0 },
      },
      vertexShader: lerpVert,
      fragmentShader: lerpFrag,
    });

    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(1);
    mesh.rotation.y = Math.PI;
    mesh.name = 'pano';
    mesh.renderOrder = 10;
    this.engine.panoMesh = mesh;
    this.engine.scene.add(mesh);

    this.hotspots = new Hotspots(this.engine);
    this.cursor = new Cursor(this.engine);
  }

  handleHotspotsVisibility(name) {
    this.engine.scene.traverse((object) => {
      if (object.name.includes('Hotspot')) {
        object.visible = false;
      }
      if (object.name.includes('Infospot')) {
        object.visible = false;
      }
    });

    this.panoItems.forEach((pano) => {
      if (pano.name === name) {
        pano.visibleHotspots?.forEach((item) => {
          const object = this.engine.scene.getObjectByName(`Hotspot_${item}`);
          object.visible = true;
        });

        pano.visibleInfospots?.forEach((item) => {
          const object = this.engine.scene.getObjectByName(`Infospot_${item}`);
          object.visible = true;
        });
      }
    });
  }

  /**
   * Applies configuration settings from the config file
   * @param {Object} config - The configuration object
   */
  applyConfig(config) {
    const { controls, hotspot, cursor, infospot } = config;

    if (controls?.firstPerson) {
      Object.assign(params.controls.firstPerson, controls.firstPerson);
      this.engine.cameraControls.setFirstPersonParams();
    }

    if (hotspot) {
      params.hotspot = hotspot;
    }

    if (cursor) {
      params.cursor = cursor;
    }

    if (infospot) {
      params.infospot = infospot;
    }
  }

  async change(name, firstInit) {
    if (this.moveGsap.isActive()) await this.moveGsap;
    this.currentPano = name;

    if (!this.cameraPositions) {
      this.cameraPositions = {};

      this.panoItems.forEach((pano) => {
        this.cameraPositions[pano.name] = {
          position: new Vector3().copy(pano.position),
          target: new Vector3(pano.target.x, pano.target.y, pano.target.z),
        };
      });
    }

    const material = this.engine.panoMesh.material;

    const { position: positionB, target: targetB } = this.cameraPositions[name];
    const positionA = this.engine.controls.getPosition();

    if (firstInit) {
      const nextTextureMap = this.engine.textures.getTexture(
        this.panoItems.find((pano) => pano.name === name).textureMap
      );
      material.uniforms.texture2.value = nextTextureMap;
      this.engine.panoMesh.position.copy(positionB);

      this.handleHotspotsVisibility(name);
      this.engine.controls.setLookAt(
        positionB.x,
        positionB.y,
        positionB.z,
        targetB.x,
        targetB.y,
        targetB.z
      );

      material.uniforms.texture1.value = material.uniforms.texture2.value;
      material.uniforms.mixRatio.value = 0;

      return;
    }

    const obj = {
      x: positionA.x,
      y: positionA.y,
      z: positionA.z,
      blend: 0,
    };

    this.moveGsap.to(obj, {
      duration: firstInit ? 0 : params.animation.move.duration,
      ease: params.animation.move.ease,
      blend: 1,
      x: positionB.x,
      y: positionB.y,
      z: positionB.z,
      onStart: () => {
        const nextTextureMap = this.engine.textures.getTexture(
          this.panoItems.find((pano) => pano.name === name).textureMap
        );
        this.handleHotspotsVisibility(name);

        material.uniforms.texture2.value = nextTextureMap;
        this.engine.panoMesh.position.copy(positionB);
      },
      onComplete: () => {
        appState.renderingStatus.next(false);
        material.uniforms.texture1.value = material.uniforms.texture2.value;
        material.uniforms.mixRatio.value = 0;
      },
      onUpdate: () => {
        this.engine.controls.moveTo(obj.x, obj.y, obj.z, true);
        const progress = this.moveGsap.progress();
        material.uniforms.mixRatio.value = progress;
      },
    });

    return this.moveGsap;
  }

  update() {
    this.cursor && this.cursor.update();
    this.hotspots && this.hotspots.update();
  }

  createPanoItem(
    name,
    textureMap,
    depthMap,
    visibleHotspots,
    visibleInfospots,
    position
  ) {
    return {
      name,
      textureMap,
      depthMap,
      /**
       * Gets the world position of the panorama
       * @returns {Vector3} The world position, either from the provided position override
       * or calculated from the scene object with matching name
       */
      get position() {
        let p;

        // p = window.engine.scene
        //   .getObjectByName(name)
        //   .getWorldPosition(new Vector3());

        return position ? new Vector3(position.x, position.y, position.z) : p;
      },
      get target() {
        const { x, y, z } = this.position;
        const t = new Vector3(
          x + EPSILON * 15,
          y + EPSILON * 0.0001,
          z - EPSILON
        );
        return t;
      },
      visibleHotspots,
      visibleInfospots,
    };
  }

  createTextureObject(textureMap) {
    return {
      path: textureMap,
      name: textureMap, // textureMap.replace(/\.[^/.]+$/, '')
      anisotropy: true,
      nonSrgb: true,
      filter: true,
      flip: true,
    };
  }
}

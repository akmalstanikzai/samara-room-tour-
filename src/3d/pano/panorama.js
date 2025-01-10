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
import { gsap, Power0,Power2, Linear, Power4, Power3 } from 'gsap';
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
  constructor(engine, postProcessing) {
    this.engine = engine;
    this.postProcessing = postProcessing;
    this.moveGsap = gsap.timeline();

    this.mouseDownPosition = null;
    this.mouseMoveThreshold = 5; // pixels
    console.log('pana')    
  }

  get listeners() {
    return [
      {
        eventTarget: params.container,
        eventName: 'mousemove',
        eventFunction: (e) => {
          this.cursor?.onMove(e);
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
            this.cursor?.onClick(e);
          }
          this.mouseDownPosition = null;
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
          target,
        }) =>
          this.createPanoItem(
            name,
            textureMap,
            depthMap,
            visibleHotspots,
            visibleInfospots,
            position,
            target
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

      const geometry = new SphereGeometry(30, 200, 200);
      geometry.scale(-1, 1, 1);

      const transitionType = params.transition.type;
      if (transitionType === 'none') {
        const material = new ShaderMaterial({
          uniforms: {
            texture1: { value: null },
            texture2: { value: null },
            mixRatio: { value: 0.0 },
            ambientLightColor: { value: new Color(0xffffff) },
            ambientLightIntensity: { value: 1.0 },
            displacementMap: { value: null },
            displacementScale: { value: 1.0 },
            time: { value: 0.0 },
            warpFactor: { value: 0 },  // Add warpFactor uniform
            blurFactor: { value: 0 },  // Add blurFactor uniform
            zoomFactor: { value: 0 }, // Add zoomFactor uniform
            opacity: { value: 1 }, // Add opacity uniform
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
      }
 
      if (transitionType === 'warp') {
        const material = new ShaderMaterial({
          uniforms: {
            texture1: { value: null },
            texture2: { value: null },
            mixRatio: { value: 0.0 },
            blurFactor: { value: 0 }, // Add blurFactor uniform
          },
          vertexShader: `varying vec2 vUv;
      
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float mixRatio;
            uniform float blurFactor;
            varying vec2 vUv;
      
            void main() {
              vec2 uv = vUv;
              vec4 texel1 = texture2D(texture1, uv);
              vec4 texel2 = texture2D(texture2, uv);
      
              // Apply a warping blur effect by sampling the texture at different offsets
              vec4 blurredTexel1 = texel1;
              vec4 blurredTexel2 = texel2;
              float offset = blurFactor * 0.01;
      
              blurredTexel1 += texture2D(texture1, uv + vec2(offset, 0.0));
              blurredTexel1 += texture2D(texture1, uv - vec2(offset, 0.0));
              blurredTexel1 += texture2D(texture1, uv + vec2(0.0, offset));
              blurredTexel1 += texture2D(texture1, uv - vec2(0.0, offset));
              blurredTexel1 *= 0.2;
      
              blurredTexel2 += texture2D(texture2, uv + vec2(offset, 0.0));
              blurredTexel2 += texture2D(texture2, uv - vec2(offset, 0.0));
              blurredTexel2 += texture2D(texture2, uv + vec2(0.0, offset));
              blurredTexel2 += texture2D(texture2, uv - vec2(0.0, offset));
              blurredTexel2 *= 0.2;
      
              gl_FragColor = mix(blurredTexel1, blurredTexel2, mixRatio);
            }`,
        });
      
        const mesh = new Mesh(geometry, material);
        mesh.scale.setScalar(1);
        mesh.rotation.y = Math.PI;
        mesh.name = 'pano';
        mesh.renderOrder = 10;
        this.engine.panoMesh = mesh;
        this.engine.scene.add(mesh);
      }

      if (transitionType === 'stretch') {
        const material = new ShaderMaterial({
          uniforms: {
            texture1: { value: null },
            texture2: { value: null },
            mixRatio: { value: 0.0 },
            stretchFactor: { value: 1.0 }, // Add stretchFactor uniform
          },
          vertexShader: `varying vec2 vUv;
      
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float mixRatio;
            uniform float stretchFactor;
            varying vec2 vUv;
      
            void main() {
              vec2 uv = vUv;
              vec4 texel1 = texture2D(texture1, uv);
              vec4 texel2 = texture2D(texture2, uv);
      
              // Apply stretch effect
              vec2 stretchUv = uv * stretchFactor;
              vec4 stretchedTexel1 = texture2D(texture1, stretchUv);
              vec4 stretchedTexel2 = texture2D(texture2, stretchUv);
      
              gl_FragColor = mix(stretchedTexel1, stretchedTexel2, mixRatio);
            }`,
        });
      
        const mesh = new Mesh(geometry, material);
        mesh.scale.setScalar(1);
        mesh.rotation.y = Math.PI;
        mesh.name = 'pano';
        mesh.renderOrder = 10;
        this.engine.panoMesh = mesh;
        this.engine.scene.add(mesh);
      }

      this.hotspots = new Hotspots(this.engine);
      this.cursor = new Cursor(this.engine);

      this.change(panoItems['1B'].startPoint, true);
    } catch (error) {
      console.error('Error loading panoItems.json:', error);
    }
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
          object && (object.visible = true);
        });

        pano.visibleInfospots?.forEach((item) => {
          const object = this.engine.scene.getObjectByName(`Infospot_${item}`);
          object && (object.visible = true);
        });
      }
    });
  }

  /**
   * Applies configuration settings from the config file
   * @param {Object} config - The configuration object
   */
  applyConfig(config) {
    const { controls, hotspot, cursor, infospot, transition } = config;

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

    if (transition) {
      params.transition = transition;
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
    const targetA = this.engine.controls.getTarget();
  
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
  
    const transitionType = params.transition.type;
    if (transitionType === 'none') {
      const obj = {
        x: positionA.x,
        y: positionA.y,
        z: positionA.z,
        blend: 0,
      };
      const distance = positionA.distanceTo(positionB);
      this.moveGsap.to(obj, {
        duration: params.transition.speed / 1000,
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
          const progress = Math.pow(this.moveGsap.progress(), 15);
          material.uniforms.mixRatio.value = progress * progress;
        },
      });
  
      return this.moveGsap;
    }
  
    if (transitionType === 'warp') {
      const obj = {
        x: positionA.x,
        y: positionA.y,
        z: positionA.z,
        blend: 0,
        blurFactor: 1,
      };
      const distance = positionA.distanceTo(positionB);
      this.moveGsap.to(obj, {
        duration: params.transition.speed / 1000,
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
          material.uniforms.blurFactor.value = 0;
        },
        onUpdate: () => {
          this.engine.controls.moveTo(obj.x, obj.y, obj.z, true);
          const progress = Math.pow(this.moveGsap.progress(), 15);
          material.uniforms.mixRatio.value = progress * progress;
          material.uniforms.blurFactor.value = obj.blurFactor;
        },
      });
    
      return this.moveGsap;
    }
    
  }

  update() {
    this.cursor?.update();
    this.hotspots?.update();
    //this.postProcessing.render()
  }

  createPanoItem(
    name,
    textureMap,
    depthMap,
    visibleHotspots,
    visibleInfospots,
    position,
    target
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
        const object = window.engine.scene.getObjectByName(name);
        return position
          ? new Vector3(position.x, position.y, position.z)
          : object?.getWorldPosition(new Vector3()) || new Vector3();
      },
      /**
       * Gets the target position for the panorama camera
       * @returns {Vector3} The target position, either from the provided target override
       * or calculated as a slight offset from the panorama position using EPSILON values
       */
      get target() {
        const { x, y, z } = this.position;
        const t = new Vector3(
          x + EPSILON * 15,
          y + EPSILON * 0.0001,
          z - EPSILON
        );

        return target ? new Vector3(target.x, target.y, target.z) : t;
      },
      visibleHotspots,
      visibleInfospots,
    };
  }

  createTextureObject(textureMap) {
    return {
      path: textureMap,
      name: textureMap,
      anisotropy: true,
      nonSrgb: true,
      filter: true,
      flip: true,
    };
  }
}

import { params } from '../settings';
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
  Layers,
} from 'three';
import { gsap, Power0, Linear, Power4, Power3 } from 'gsap';
import { appState } from '../../services/app-state';
import { CursorPin } from './cursor';
import { Hotspots } from './hotspots';
import { loadGltf } from '../model-loader';
const EPS = 0.000011177461712 * 0.0001;

export class Panorama {
  constructor(engine) {
    this.engine = engine;
    this.moveGsap = gsap.timeline();

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
    try {
      const response = await fetch(`${params.paths.assets_path}panoItems.json`);
      const data = await response.json();

      console.log(data);

      this.panoItems = data['1B'].hotspots.map(
        ({ name, textureMap, visible, depthMap }) =>
          this.createPanoItem(name, textureMap, visible, depthMap)
      );

      // Create texture objects in a new array
      const newTextureObjects = this.panoItems
        .flatMap(({ textureMap, depthMap }) => [
          this.createTextureObject(textureMap),
          depthMap ? this.createTextureObject(depthMap, '.png') : null,
        ])
        .filter(Boolean);

      this.panoItems.forEach((el) => {
        if (el.depthMap) console.log(el);
      });

      // Load textures and wait for all to complete
      await Promise.all(
        newTextureObjects.map(async (texture) => {
          await this.engine.textures.loadTexture(texture, 'map');
        })
      );

      // Push loaded textures to params.textures
      params.textures.push(...newTextureObjects);
      this.engine.meshes = [];

      const model = await loadGltf(
        `${params.paths.assets_path + data['1B'].model}`,
        params.paths.decoders_path
      );

      model.scene.children.forEach((child) => {
        child.children.forEach((object) => {
          if (object.material) {
            if (object.material.name === 'Tables') {
              // object.visible = false;
              object.material.colorWrite = false;
              object.renderOrder = 1000; // Render tables last
            } else if (object.material.name === 'Interior') {
              object.material.colorWrite = false;
              object.renderOrder = 1000; // Render tables last
            } else {
              object.visible = false;
              object.renderOrder = 10;
            }
          }
          this.engine.models.group.add(object.clone());
        });
      });
      // this.centerModels(this.group);

      this.engine.models.group.box = this.engine.models.computeBoundingBox(
        this.engine.models.group
      );

      this.engine.scene.traverse((object) => {
        if (
          object instanceof Mesh &&
          object.material
          // && object.material.name !== 'Tables'
        )
          this.engine.meshes.push(object);
      });
    } catch (error) {
      console.error('Error loading panoItems.json:', error);
    }

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
        displacementMap: { value: null },
        displacementScale: { value: 1.0 },
      },
      vertexShader: `
      uniform sampler2D displacementMap;
      uniform float displacementScale;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 displacement = texture2D(displacementMap, uv);
        vec3 newPosition = position + normal * displacement.r * displacementScale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
      `,
      fragmentShader: `
      uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform float mixRatio;
      uniform vec3 ambientLightColor;
      uniform float ambientLightIntensity;
      varying vec2 vUv;
      void main() {
        vec4 tex1 = texture2D(texture1, vUv);
        vec4 tex2 = texture2D(texture2, vUv);
        vec4 mixedColor = mix(tex1, tex2, mixRatio);

        // Apply ambient light
        vec3 ambient = ambientLightColor * ambientLightIntensity;
        vec3 finalColor = mixedColor.rgb * ambient;

        gl_FragColor = vec4(finalColor, mixedColor.a);
      }
      `,
    });

    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(1);
    mesh.rotation.y = 3.14;
    mesh.name = 'pano';
    mesh.renderOrder = 10;
    this.engine.panoMesh = mesh;
    this.engine.scene.add(mesh);
    // this.engine.models.centerModels(mesh);

    this.hotspots = new Hotspots(this.engine);
    this.cursor = new CursorPin(this.engine);
  }

  async change(name, firstInit) {
    if (this.moveGsap.isActive()) return;

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

    this.moveGsap
      .to(obj, {
        duration: firstInit ? 0.005 : params.animation.move.duration / 2,
        blend: 0.5,
        x: (positionA.x + positionB.x) / 2,
        y: (positionA.y + positionB.y) / 2,
        z: (positionA.z + positionB.z) / 2,
        onStart: () => {
          this.engine.panoMesh.position.copy(positionB);

          this.engine.scene.traverse((object) => {
            if (object.name.includes('Hotspot')) {
              object.visible = false;
            }
          });
          this.panoItems.forEach((pano) => {
            if (pano.name === name) {
              pano.visible.forEach((item) => {
                const object = this.engine.scene.getObjectByName(
                  `Hotspot_${item}`
                );
                object.visible = true;
              });
            }
          });

          const nextPano = this.panoItems.find((pano) => pano.name === name);
          const nextTextureMap = this.engine.textures.getTexture(
            nextPano.textureMap
          );
          const nextDepthMap = nextPano.depthMap
            ? this.engine.textures.getTexture(nextPano.depthMap)
            : null;

          material.uniforms.texture2.value = nextTextureMap;
          material.uniforms.displacementMap.value = nextDepthMap;
          material.uniforms.displacementScale.value = nextDepthMap ? 15.0 : 0.0; // Adjust scale as needed
        },
        onUpdate: () => {
          this.engine.controls.moveTo(obj.x, obj.y, obj.z, true);
          const progress = this.moveGsap.progress() * 2; // Adjust progress for first half
          material.uniforms.mixRatio.value = progress;
        },
      })
      .to(obj, {
        duration: firstInit ? 0.005 : params.animation.move.duration / 2,
        blend: 1,
        x: positionB.x,
        y: positionB.y,
        z: positionB.z,
        onStart: () => {},
        onUpdate: () => {
          this.engine.controls.moveTo(obj.x, obj.y, obj.z, true);
          const progress = (this.moveGsap.progress() - 0.5) * 2; // Adjust progress for second half
          material.uniforms.mixRatio.value = 0.5 + progress * 0.5;
        },
        onComplete: () => {
          appState.renderingStatus.next(false);
          material.uniforms.texture1.value = material.uniforms.texture2.value;
          material.uniforms.mixRatio.value = 0;
        },
      });

    return this.moveGsap;
  }

  update() {
    this.cursor && this.cursor.update();
    this.hotspots && this.hotspots.update();
  }

  createPanoItem(name, textureMap, visible, depthMap) {
    return {
      name,
      textureMap,
      depthMap,
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
    };
  }

  createTextureObject(textureMap, extension = '.webp') {
    return {
      path: textureMap + extension,
      name: textureMap,
      anisotropy: true,
      filter: true,
      flip: true,
    };
  }
}

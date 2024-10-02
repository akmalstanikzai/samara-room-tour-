import * as THREE from 'three';
import { loadGltf } from '../model-loader';
import { params } from '../settings';
import { gsap } from 'gsap';
import { appState } from '../../services/app-state';

export class Panorama {
  constructor(engine) {
    this.engine = engine;
    this.name = 'pano';
  }

  async setup() {
    this.items = [
      {
        name: 'Sprite_pano1',
        cameraMap: 'bed',
        textureMap: 'studio_360_1',
        position: {
          x: params.cameras.studio.bed.position.x,
          y: params.cameras.studio.bed.position.y,
          z: params.cameras.studio.bed.position.z,
        },
        visible: ['Sprite_pano1', 'Sprite_pano2'],
        visibleLabels: ['label_bed', 'label_kitchen'],
      },
      {
        name: 'Sprite_pano2',
        cameraMap: 'kitchen',
        textureMap: 'studio_360',
        position: {
          x: params.cameras.studio.kitchen.position.x,
          y: params.cameras.studio.kitchen.position.y,
          z: params.cameras.studio.kitchen.position.z,
        },
        visible: ['Sprite_pano1', 'Sprite_pano2', 'Sprite_pano3'],
        visibleLabels: ['label_bed', 'label_kitchen', 'label_hallway'],
      },

      {
        name: 'Sprite_pano3',
        cameraMap: 'hallway',
        textureMap: 'studio_360_2',
        position: {
          x: params.cameras.studio.hallway.position.x,
          y: params.cameras.studio.hallway.position.y,
          z: params.cameras.studio.hallway.position.z,
        },
        visible: ['Sprite_pano3', 'Sprite_pano2'],
        visibleLabels: ['label_kitchen', 'label_hallway'],
      },
    ];

    this.items.forEach((pano) => {
      const sprite = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.1),
        new THREE.MeshBasicMaterial({
          map: this.engine.textures.getTexture('pin'),
          transparent: true,
          side: THREE.DoubleSide,
          depthTest: false,
        })
      );

      sprite.rotation.x = Math.PI / 2;
      sprite.visible = false;
      sprite.position.copy(pano.position);
      sprite.name = pano.name;
      sprite.position.y = -0.41;
      sprite.renderOrder = 50;
      this.engine.scene.add(sprite);
    });

    const geometry = new THREE.SphereGeometry(6, 200, 200);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        texture1: { value: this.engine.textures.getTexture('studio_360') },
        texture2: { value: this.engine.textures.getTexture('studio_360') },
        mixRatio: { value: 0.0 },
        ambientLightColor: { value: new THREE.Color(0xffffff) },
        ambientLightIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(1);
    mesh.rotation.y = 1.567;
    mesh.name = 'pano';
    mesh.renderOrder = 10;
    this.engine.panoMesh = mesh;
    this.engine.scene.add(mesh);

    // this.engine.models.visible = false;
    // this.engine.models.skydome.visible = false;
    // this.engine.setCam('kitchen');
  }

  toggleVisibility(name = this.name === 'pano' ? '3d' : 'pano') {
    this.name = name;
    const mesh = this.engine.scene.getObjectByName('pano');
    if (mesh) {
      if (name === 'pano') {
        mesh.visible = true;
        this.engine.models.visible = false;
      }

      if (name === '3d') {
        mesh.visible = false;
        this.engine.models.visible = true;
      }
    }
  }
}

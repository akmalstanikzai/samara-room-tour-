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

    const geometry = new THREE.SphereGeometry(6, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshLambertMaterial({
      map: this.engine.textures.getTexture('studio_360'),
      depthTest: false,
      transparent: true,
      opacity: 0,
    });
    material.map.mapping = THREE.EquirectangularReflectionMapping;
    material.map.flipY = true;

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
    !this.gsap && (this.gsap = gsap.timeline());
    const mesh = this.engine.scene.getObjectByName('pano');
    if (mesh) {
      if (name === 'pano') {
        this.gsap.to(mesh.material, {
          opacity: 1,
          ease: params.animation.fadeIn.ease,
          duration: params.animation.fadeIn.duration,
          onUpdate: () => {
            appState.renderingStatus.next(true);
          },
          onComplete: () => {
            appState.renderingStatus.next(false);
          },
        });
      }

      if (name === '3d') {
        this.gsap.to(mesh.material, {
          opacity: 0,
          ease: params.animation.fadeOut.ease,
          duration: params.animation.fadeOut.duration,
          onUpdate: () => {
            appState.renderingStatus.next(true);
          },
          onComplete: () => {
            appState.renderingStatus.next(false);
          },
        });
      }
    }
  }
}

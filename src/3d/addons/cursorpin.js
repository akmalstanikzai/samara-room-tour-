import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshNormalMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Raycaster,
  Vector3,
} from 'three';

import * as THREE from 'three';
import { params } from '../settings';
import { appState } from '../../services/app-state';
import { delayMs } from '../../utils/delay';

export class CursorPin {
  constructor(engine) {
    this.engine = engine;
    this.init();
  }

  init() {
    const geometry = new PlaneGeometry(0.03, 0.03);

    const material = new MeshPhysicalMaterial({
      color: 0x333333,
      side: DoubleSide,
      map: this.engine.textures.getTexture('pin'),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false,
    });
    this.pin = new Mesh(geometry, material);
    this.pin.visible = false;
    this.pin.renderOrder = 50;
    this.pin.name = 'pin';
    this.engine.scene.add(this.pin);

    this.raycaster = new Raycaster();
    this.mouseHelper = new Mesh(
      new BoxGeometry(1, 1, 10),
      new MeshNormalMaterial()
    );
    this.mouseHelper.visible = false;

    this.intersection = {
      intersects: false,
      point: new Vector3(),
      normal: new Vector3(),
    };

    this.intersects = [];
    this.intersects2 = [];

    this.mouse = new Vector3();
  }

  onMove(e) {
    if (
      appState.cam.value === 'outside' ||
      appState.cam.value === 'floor plan'
    ) {
      this.pin.visible = false;
      params.container.style.cursor = 'auto';

      return;
    }

    const containerRect = params.container.getBoundingClientRect();
    const containerX = containerRect.left;
    const containerY = containerRect.top;
    const x = e.clientX - containerX;
    const y = e.clientY - containerY;

    this.mouse.x = (x / window.innerWidth) * 2 - 1;
    this.mouse.y = -(y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.engine.camera);
    const visibleObjects = this.engine.meshes.filter(
      (mesh) => mesh.material && mesh.material.opacity > 0.3
    );
    this.raycaster.intersectObjects(visibleObjects, false, this.intersects);

    if (this.intersects.length > 0) {
      // Sort intersects to prioritize Sprites
      this.intersects.sort((a, b) => {
        if (
          a.object.name.includes('Sprite') &&
          !b.object.name.includes('Sprite')
        )
          return -1;
        if (
          !a.object.name.includes('Sprite') &&
          b.object.name.includes('Sprite')
        )
          return 1;
        return 0;
      });

      const firstIntersect = this.intersects[0];
      if (firstIntersect.object.name.includes('Sprite')) {
        this.pin.visible = false;
        params.container.style.cursor = 'pointer';
      } else {
        this.pin.visible = true;
        params.container.style.cursor = 'auto';

        const point = firstIntersect.point;
        this.mouseHelper.position.copy(point);
        this.intersection.point.copy(point);

        const normal = firstIntersect.face.normal.clone();
        normal.transformDirection(firstIntersect.object.matrixWorld);
        normal.add(firstIntersect.point);

        this.intersection.normal.copy(firstIntersect.face.normal);
        this.mouseHelper.lookAt(normal);

        this.pin.position.copy(this.intersection.point);
        this.pin.rotation.copy(this.mouseHelper.rotation);

        this.intersection.intersects = true;
      }

      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
      this.pin.visible = false;
    }
  }

  update() {
    const currentCam = appState.cam.value;

    this.engine.panorama.items.forEach((item) => {
      if (item.cameraMap === currentCam) {
        item.visible.forEach((el) => {
          const helper = this.engine.scene.getObjectByName(el);
          helper.material.opacity += (1 - helper.material.opacity) * 0.1;
        });
      } else {
        const helper = this.engine.scene.getObjectByName(item.name);
        helper.material.opacity += (0 - helper.material.opacity) * 0.1;
      }
    });
  }

  onClick(e) {
    const x = e.clientX;
    const y = e.clientY;

    this.mouse.x = (x / window.innerWidth) * 2 - 1;
    this.mouse.y = -(y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.engine.camera);

    this.raycaster.intersectObjects(this.engine.meshes, false, this.intersects);

    if (this.intersects.length > 0) {
      this.intersects.forEach((object) => {
        if (object.object.name.includes('Sprite')) {
          const cameraMap = this.engine.panorama.items.find(
            (pano) => pano.name === object.object.name
          ).cameraMap;
          const textureMap = this.engine.panorama.items.find(
            (pano) => pano.name === object.object.name
          ).textureMap;
          const position = params.cameras.studio[cameraMap].position;

          const move = async () => {
            this.engine.panorama.toggleVisibility('3d');

            this.engine.CameraGsap.move(position.x, position.z);
            await delayMs(params.animation.transitionDelay.duration * 1000);
            const pano = this.engine.scene.getObjectByName('pano');
            pano.material.map = this.engine.textures.getTexture(textureMap);
            pano.material.map.flipY = true;
            this.engine.panorama.toggleVisibility('pano');
          };
          appState.cam.next(cameraMap);
          move();
        }
      });
    }
    // if (this.intersects.length > 0) {
    //   const point = this.intersects[0].point;

    //   this.mouseHelper.position.copy(point);
    //   this.intersection.point.copy(point);
    //   const distance = this.engine.camera.position.distanceTo(
    //     this.mouseHelper.position
    //   );

    //   const direction = new THREE.Vector3();
    //   this.engine.camera.getWorldDirection(direction);
    //   const raycaster = new THREE.Raycaster(
    //     this.mouseHelper.position,
    //     direction.normalize()
    //   );

    //   // Set a reasonable distance for the raycaster to detect collisions
    //   const collisionDistance = 0.01; // Adjust this value based on your scene scale

    //   // Collect only the meshes that have a material name including 'Wall'
    //   const wallMeshes = [];
    //   this.engine.scene.traverse((object) => {
    //     if (
    //       object.isMesh &&
    //       object.material &&
    //       object.material.name.includes('Wall')
    //     ) {
    //       wallMeshes.push(object);
    //     }
    //   });

    //   // Perform the raycast specifically against these wall meshes
    //   const intersects = raycaster.intersectObjects(wallMeshes, true);

    //   if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
    //     console.log('Wall too close, cannot move forward!');
    //     // Here you can handle the logic to prevent the camera from moving forward
    //     // For example, you might not update the camera's position or apply some other logic
    //   } else {
    //     this.engine.CameraGsap.move(
    //       this.mouseHelper.position.x,
    //       this.mouseHelper.position.z,
    //       distance
    //     );
    //     // If no collision, update the camera position normally
    //     // this.camera.position.add(direction.multiplyScalar(this.moveSpeed));
    //     // console.log('Moved camera to', this.camera.position);
    //   }
    // }
  }
}

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
import { params } from './settings';
import { appState } from '../services/app-state';

export class CursorPin {
  constructor(engine) {
    this.engine = engine;
    this.init();
  }

  init() {
    const geometry = new PlaneGeometry(0.1, 0.1);

    const material = new MeshPhysicalMaterial({
      color: 0xffffff,
      side: DoubleSide,
      map: this.engine.textures.getTexture('cursor'),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false,
    });
    this.pin = new Mesh(geometry, material);
    this.pin.visible = false;
    this.pin.renderOrder = 50;
    this.pin.name = 'pin';
    this.pin.scale.setScalar(3);
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
    const mouseX = e.clientX - containerX;
    const mouseY = e.clientY - containerY;

    this.mouse.x = (mouseX / params.container.clientWidth) * 2 - 1;
    this.mouse.y = -(mouseY / params.container.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.engine.camera);
    const visibleObjects = this.engine.meshes.filter(
      (mesh) => mesh.material && mesh.material.opacity > 0.3

      // &&  mesh.material.name !== 'WoodCh_S_studio' &&
      // mesh.material.name !== 'Chair_studio'
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
        // Disable camera rotation
        this.engine.controls.enabled = false;
      } else {
        this.pin.visible = true;
        params.container.style.cursor = 'auto';
        // Enable camera rotation
        this.engine.controls.enabled = true;

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
      // Enable camera rotation when not intersecting with any object
      this.engine.controls.enabled = true;
    }
  }

  update() {
    const currentCam = appState.cam.value;

    // this.engine.panorama.items.forEach((item) => {
    //   if (item.cameraMap === currentCam) {
    //     item.visible.forEach((el) => {
    //       const helper = this.engine.scene.getObjectByName(el);
    //       helper.material.opacity += (1 - helper.material.opacity) * 0.1;
    //     });
    //   } else {
    //     const helper = this.engine.scene.getObjectByName(item.name);
    //     helper.material.opacity += (0 - helper.material.opacity) * 0.1;
    //   }
    // });
  }

  onClick(e) {
    this.raycaster.intersectObjects(this.engine.meshes, false, this.intersects);

    if (this.intersects.length > 0) {
      // Check all intersected objects for Sprites
      const spriteIntersect = this.intersects.find((intersect) =>
        intersect.object.name.includes('Sprite')
      );

      if (spriteIntersect) {
        const cameraMap = this.engine.panorama.items.find(
          (pano) => pano.name === spriteIntersect.object.name
        ).cameraMap;
        this.engine.CameraGsap.setCam(cameraMap);
      } else {
        // If no Sprite found, find the closest Sprite
        const clickPoint = this.intersects[0].point;
        let closestSprite = null;
        let closestDistance = Infinity;

        const sprites = this.engine.meshes.filter((mesh) =>
          mesh.name.includes('Sprite')
        );

        sprites.forEach((sprite) => {
          const distance = clickPoint.distanceTo(sprite.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSprite = sprite;
          }
        });

        if (closestSprite) {
          const cameraMap = this.engine.panorama.items.find(
            (pano) => pano.name === closestSprite.name
          ).cameraMap;
          this.engine.CameraGsap.setCam(cameraMap);
        }
      }
    }
  }
}

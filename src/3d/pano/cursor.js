import {
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshNormalMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Raycaster,
  Vector3,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  Vector2,
} from 'three';
import { params } from '../settings';
import { gsap } from 'gsap';
import { userDevice } from '../../utils/browser-detection';

/** Cursor */
export class Cursor {
  constructor(engine) {
    this.engine = engine;
    this.init();
    this.hoveredHotspot = null;
    this.targetQuaternion = new Quaternion();
  }

  init() {
    const geometry = new PlaneGeometry(params.cursor.size, params.cursor.size);

    const material = new MeshBasicMaterial({
      color: new Color(Number(`0x${params.cursor.color}`)),
      side: DoubleSide,
      map: this.engine.textures.getTexture('Cursor.png'),
      transparent: true,
      // opacity: 0.8,
      depthWrite: false,
      depthTest: false,
    });
    this.pin = new Mesh(geometry, material);
    this.pin.visible = false;
    this.pin.renderOrder = 15;
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
    this.mouse = new Vector3();
  }

  /**
   * Gets the current cursor position as a Vector2.
   * @returns {Vector2} The cursor position in normalized device coordinates.
   */

  get cursorPosition() {
    return new Vector2(this.mouse.x, this.mouse.y);
  }

  onMove(e) {
    const containerRect = params.container.getBoundingClientRect();
    const containerX = containerRect.left;
    const containerY = containerRect.top;
    const mouseX = e.clientX - containerX;
    const mouseY = e.clientY - containerY;

    this.mouse.x = (mouseX / params.container.clientWidth) * 2 - 1;
    this.mouse.y = -(mouseY / params.container.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.engine.camera);
    const visibleObjects = this.engine.meshes.filter(
      (mesh) => mesh.material && mesh.material.opacity > 0.2
    );
    this.raycaster.intersectObjects(visibleObjects, false, this.intersects);

    if (this.intersects.length > 0) {
      // Sort intersects to prioritize Hotspots
      this.intersects.sort((a, b) => {
        if (
          a.object.name.includes('Hotspot') &&
          !b.object.name.includes('Hotspot')
        )
          return -1;
        if (
          !a.object.name.includes('Hotspot') &&
          b.object.name.includes('Hotspot')
        )
          return 1;
        return 0;
      });

      const firstIntersect = this.intersects[0];
      if (
        firstIntersect.object.visible &&
        firstIntersect.object.name.includes('Hotspot')
      ) {
        this.pin.visible = false;
        if (!userDevice.isMobile) {
          params.container.classList.add('cursor-pointer');
        }

        // Animate hotspot opacity to 1
        if (this.hoveredHotspot !== firstIntersect.object) {
          if (this.hoveredHotspot) {
            this.animateHotspotOpacity(
              this.hoveredHotspot,
              params.hostpot.opacity
            );
          }
          this.hoveredHotspot = firstIntersect.object;
          this.animateHotspotOpacity(
            this.hoveredHotspot,
            params.hotspot.hoverOpacity
          );
        }
      } else if (
        firstIntersect.object.visible &&
        firstIntersect.object.name.includes('Info')
      ) {
        this.pin.visible = false;

        if (!userDevice.isMobile) {
          params.container.classList.add('cursor-pointer');
        }
        this.engine.pano.hotspots.showPopup(firstIntersect.object);
      } else {
        this.engine.pano.hotspots.hidePopup();
        if (!userDevice.isMobile) {
          this.pin.visible = true;
          params.container.style.cursor = 'auto';
          params.container.classList.remove('cursor-pointer');
        }

        const point = firstIntersect.point;
        this.mouseHelper.position.copy(point);
        this.intersection.point.copy(point);

        if (firstIntersect.face) {
          const normal = firstIntersect.face.normal.clone();
          normal.transformDirection(firstIntersect.object.matrixWorld);
          normal.add(firstIntersect.point);

          this.intersection.normal.copy(firstIntersect.face.normal);
          this.mouseHelper.lookAt(normal);
        }

        this.pin.position.copy(this.intersection.point);

        // Store the target rotation
        this.targetQuaternion.setFromEuler(this.mouseHelper.rotation);

        // Don't copy rotation directly here, we'll interpolate in the update method
        // this.pin.rotation.copy(this.mouseHelper.rotation);

        this.intersection.intersects = true;

        if (this.hoveredHotspot) {
          this.animateHotspotOpacity(
            this.hoveredHotspot,
            params.hotspot.opacity
          );
          this.hoveredHotspot = null;
        }
      }

      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
      this.pin.visible = false;
      // Enable camera rotation when not intersecting with any object
      this.engine.controls.enabled = true;

      if (this.hoveredHotspot) {
        this.animateHotspotOpacity(this.hoveredHotspot, params.hotspot.opacity);
        this.hoveredHotspot = null;
      }
    }
  }

  animateHotspotOpacity(hotspot, targetOpacity) {
    gsap.to(hotspot.material, {
      opacity: targetOpacity,
      duration: params.hotspot.hoverTransitionTime,
      ease: 'power2.out',
    });
  }

  update(deltaTime) {
    // Smoothly interpolate the rotation
    this.pin.quaternion.slerp(this.targetQuaternion, params.cursor.lerpFactor);
  }

  onClick(e) {
    this.raycaster.intersectObjects(this.engine.meshes, false, this.intersects);

    if (this.intersects.length > 0) {
      // Check all intersected objects for Hotspots
      const hotspotIntersect = this.intersects.find(
        (intersect) =>
          intersect.object.name.includes('Hotspot') && intersect.object.visible
      );

      if (hotspotIntersect) {
        const cameraMap = this.engine.pano.panoItems.find((pano) =>
          hotspotIntersect.object.name.includes(pano.name)
        );
        this.engine.pano.change(cameraMap.name);
      }
    }
  }

  findClosestHotspot(clickPoint) {
    // If no Hotspot found, find the closest visible Hotspot
    let closestHotspot = null;
    let closestDistance = Infinity;

    const visibleHotspots = this.engine.meshes.filter(
      (mesh) => mesh.name.includes('Hotspot') && mesh.visible
    );

    visibleHotspots.forEach((hostpot) => {
      const distance = clickPoint.distanceTo(hostpot.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestHotspot = hostpot;
      }
    });

    if (closestHotspot) {
      const cameraMap = this.engine.pano.panoItems.find((pano) =>
        closestHotspot.name.includes(pano.name)
      );
      this.engine.pano.change(cameraMap.name);
    }
  }

  onDoubleClick(e) {
    this.raycaster.intersectObjects(this.engine.meshes, false, this.intersects);

    if (this.intersects.length > 0) {
      // Call the findClosestHotspot method with the intersection point
      this.findClosestHotspot(this.intersects[0].point);
    }
  }
}

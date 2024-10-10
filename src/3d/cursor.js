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
} from 'three';
import { params } from './settings';
import { appState } from '../services/app-state';
import { gsap } from 'gsap';
import { userDevice } from '../utils/browser-detection';

export class CursorPin {
  constructor(engine) {
    this.engine = engine;
    this.init();
    this.hoveredHotspot = null;
    this.targetQuaternion = new Quaternion();
    this.lerpFactor = 0.1; // Adjust this value to control the smoothness (0.1 = smooth, 1 = instant)
  }

  init() {
    const geometry = new PlaneGeometry(0.1, 0.1);

    const material = new MeshBasicMaterial({
      color: new Color(0xcccccc),
      side: DoubleSide,
      map: this.engine.textures.getTexture('cursor'),
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
    this.intersects2 = [];

    this.mouse = new Vector3();
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
          params.container.style.cursor = 'pointer';
          this.engine.controls.enabled = false;
        }

        // Animate hotspot opacity to 1
        if (this.hoveredHotspot !== firstIntersect.object) {
          if (this.hoveredHotspot) {
            this.animateHotspotOpacity(this.hoveredHotspot, 0.5);
          }
          this.hoveredHotspot = firstIntersect.object;
          this.animateHotspotOpacity(this.hoveredHotspot, 1);
        }
      } else {
        if (!userDevice.isMobile) {
          this.pin.visible = true;
          params.container.style.cursor = 'auto';
          this.engine.controls.enabled = true;
        }

        const point = firstIntersect.point;
        this.mouseHelper.position.copy(point);
        this.intersection.point.copy(point);

        const normal = firstIntersect.face.normal.clone();
        normal.transformDirection(firstIntersect.object.matrixWorld);
        normal.add(firstIntersect.point);

        this.intersection.normal.copy(firstIntersect.face.normal);
        this.mouseHelper.lookAt(normal);

        this.pin.position.copy(this.intersection.point);

        // Store the target rotation
        this.targetQuaternion.setFromEuler(this.mouseHelper.rotation);

        // Don't copy rotation directly here, we'll interpolate in the update method
        // this.pin.rotation.copy(this.mouseHelper.rotation);

        this.intersection.intersects = true;

        // Animate previously hovered hotspot opacity back to 0.5
        if (this.hoveredHotspot) {
          this.animateHotspotOpacity(this.hoveredHotspot, 0.3);
          this.hoveredHotspot = null;
        }
      }

      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
      this.pin.visible = false;
      // Enable camera rotation when not intersecting with any object
      this.engine.controls.enabled = true;

      // Animate previously hovered hotspot opacity back to 0.5
      if (this.hoveredHotspot) {
        this.animateHotspotOpacity(this.hoveredHotspot, 0.3);
        this.hoveredHotspot = null;
      }
    }
  }

  animateHotspotOpacity(hotspot, targetOpacity) {
    gsap.to(hotspot.material, {
      opacity: targetOpacity,
      duration: 1,
      ease: 'power2.out',
    });
  }

  update(deltaTime) {
    // Smoothly interpolate the rotation
    this.pin.quaternion.slerp(this.targetQuaternion, this.lerpFactor);
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
        const cameraMap = params.pano.find((pano) =>
          hotspotIntersect.object.name.includes(pano.name)
        );
        this.engine.pano.move(cameraMap.name);
      } else {
        // If no Hotspot found, find the closest visible Hotspot
        const clickPoint = this.intersects[0].point;
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
          const cameraMap = params.pano.find((pano) =>
            closestHotspot.name.includes(pano.name)
          );
          this.engine.pano.move(cameraMap.name);
        }
      }
    }
  }
}

import gsap from 'gsap';
import { Mesh, Vector3 } from 'three';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { capitalize } from 'lodash';

import { params } from '../settings';
import { appState } from '../../services/app-state';

export class Labels {
  constructor(engine) {
    this.engine = engine;
    this.init();
  }

  init() {
    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.setSize(
      params.container.clientWidth,
      params.container.clientHeight
    );
    document.body.appendChild(this.css2DRenderer.domElement);
    this.css2DRenderer.domElement.style.position = 'absolute';
    this.css2DRenderer.domElement.style.pointerEvents = 'none';
    this.css2DRenderer.domElement.style.zIndex = '999';
    this.css2DRenderer.domElement.style.top = '0px';
    const render = () => {
      this.css2DRenderer.render(this.engine.scene, this.engine.camera);
    };
    gsap.ticker.add(render);

    appState.complectation.subscribe((res) => {
      if (res.changedValue === 'layout') {
        this.engine.cursor.pin.visible = false;
        this.removeLabels();
        this.engine.plan.cutTop(false);
        this.engine.controls.enabled = true;
      }
    });
  }

  initCursor() {
    this.engine.cursor.pin.visible = true;
    this.engine.meshes = [];
    this.engine.scene.traverse((object) => {
      if (object.name === appState.complectation.value.layout) {
        object.traverse((child) => {
          if (child instanceof Mesh) this.engine.meshes.push(child);
        });
      }
    });
    this.engine.scene.traverse((object) => {
      if (object.name.includes('Sprite')) {
        this.engine.meshes.push(object);
      }
    });
  }

  removeLabels() {
    this.labels &&
      this.labels.forEach((label) => {
        label && label.remove();
        label && this.engine.scene.remove(label);
      });
  }

  addLabels() {
    this.removeLabels();
    this.labels = [];
    Object.keys(params.cameras[appState.complectation.value.layout]).forEach(
      (camKey) => {
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = capitalize(camKey);

        const textLabel = new CSS2DObject(div);

        div.onclick = () => {
          this.engine.CameraGsap.setCam(camKey);
          this.initCursor();
          this.removeLabels();
          this.engine.plan.cutTop(false);
        };

        const pos =
          params.cameras[appState.complectation.value.layout][camKey].position;
        textLabel.position.copy(pos);
        this.engine.scene.add(textLabel);
        this.labels.push(textLabel);
      }
    );
  }

  onResize(width = window.innerWidth, height = window.innerHeight) {
    this.css2DRenderer.setSize(width, height);
  }
}

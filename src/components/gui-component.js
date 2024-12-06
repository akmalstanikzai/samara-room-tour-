import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from '../3d/libs/lil-gui-modified';
import { params } from '../3d/settings';
import { Textures } from '../3d/textures';
import { CameraGsap } from '../3d/camera-gsap';
import { html, LitElement, nothing, css } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { appState } from '../services/app-state';
import { auditTime } from 'rxjs/operators';
import { SRGBColorSpace, TextureLoader } from 'three';
import {
  Expo,
  Sine,
  Power0,
  Power1,
  Power2,
  Power3,
  Power4,
  Back,
  Elastic,
  Bounce,
  Circ,
  Linear,
} from 'gsap';
import { postProcessing } from '../3d/post-processing';

export class ButtonComponent extends LitElement {
  constructor() {
    super();
  }

  static get styles() {
    return [
      css`
        .picker-el {
          color: #fff;
          cursor: pointer;
          display: flex;
          padding: 0.5em 1.5em 0.5em 1.5em;
          margin: 0.875em 0 0.875em 0;
          justify-content: center;
          align-items: center;
          border-radius: 0.5em;
        }
        .picker-el img {
          width: 3em;
          height: 3em;
        }
        .picker-el:hover {
          opacity: 0.8;
        }
        .picker-el__wrapper {
          margin-left: 0.5em;
          margin-right: 0.5em;
        }
        .picker-el__active {
          box-shadow: #00b0f0 0 0 0.5em;
        }
        .picker-el__disabled {
          opacity: 0.3;
          pointer-events: none;
        }
        .inline {
          display: inline-flex;
        }
      `,
    ];
  }

  connectedCallback() {
    super.connectedCallback();
  }

  getImagesFromMaterials(material) {
    const images = {
      material: material,
    };
    const materialProperties = [
      'map',
      'normalMap',
      'aoMap',
      'lightMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
      'alphaMap',
    ];

    window.engine.scene.getObjectByName(this.parent).traverse((el) => {
      if (el.material && el.material.name === this.material) {
        materialProperties.forEach((prop) => {
          if (el.material[prop]) {
            images[prop] = el.material[prop].image;
          }
        });
      }
    });

    return images;
  }

  static get properties() {
    return {
      material: '',
      parent: '',
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  handleClick(name) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.png, .jpg');
    input.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      const fileURL = URL.createObjectURL(file);

      const texture = await new TextureLoader().loadAsync(fileURL);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;

      window.engine.scene.traverse((el) => {
        if (el.material && el.material.name === this.material) {
          if (name === 'ao') {
            el.material.aoMap = texture;
            el.material.aoMap.channel = 1;
          }

          if (name === 'lightMap') {
            el.material.lightMap = texture;
            el.material.lightMap.channel = 1;
          }

          if (name === 'map') {
            el.material.map = texture;
          }

          if (name === 'normal') {
            el.material.normalMap = texture;
          }

          if (name === 'roughness') {
            el.material.roughnessMap = texture;
          }

          if (name === 'metalness') {
            el.material.metalnessMap = texture;
          }

          if (name === 'emissive') {
            el.material.emissiveMap = texture;
          }

          el.material.needsUpdate = true;
        }
      });
      this.getImagesFromMaterials();
      this.requestUpdate();
      window.engine.update();
    });

    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  handleDelete(name) {
    window.engine.scene.traverse((el) => {
      if (el.material && el.material.name === this.material) {
        if (name === 'ao') {
          el.material.aoMap = null;
        }

        if (name === 'lightMap') {
          el.material.lightMap = null;
        }

        if (name === 'map') {
          el.material.map = null;
        }

        if (name === 'normal') {
          el.material.normalMap = null;
        }

        if (name === 'roughness') {
          el.material.roughnessMap = null;
        }

        if (name === 'metalness') {
          el.material.metalnessMap = null;
        }

        if (name === 'emissive') {
          el.material.emissiveMap = null;
        }

        el.material.needsUpdate = true;
      }
    });
    this.getImagesFromMaterials();
    this.requestUpdate();
    window.engine.update();
  }

  firstUpdated() {}

  render() {
    this.images = this.getImagesFromMaterials(this.material);

    const mapElement = (map, name) => html`
      <div class="picker-el__wrapper inline">
        <div
          @click="${() => {
            this.handleClick(name);
          }}"
          class="picker-el"
        >
          ${map && map.currentSrc && !map.currentSrc.includes('blob')
            ? html`<img src="${map.currentSrc}" /> `
            : html`${map}`}
          ${name.charAt(0).toUpperCase() + name.slice(1)}
        </div>

        <div
          @click="${() => {
            this.handleDelete(name);
          }}"
          class="picker-el"
        >
          x
        </div>
      </div>
    `;

    return html`
      ${mapElement(this.images.map, 'map')}
      ${mapElement(this.images.aoMap, 'ao')}
      ${mapElement(this.images.lightMap, 'lightMap')}
      ${mapElement(this.images.normalMap, 'normal')}
      ${mapElement(this.images.roughnessMap, 'roughness')}
      ${mapElement(this.images.metalnessMap, 'metalness')}
      ${mapElement(this.images.emissiveMap, 'emissive')}
      ${mapElement(this.images.alphaMap, 'alpha')}
    `;
  }
}

customElements.define('button-component', ButtonComponent);

export class GuiComponent extends LitElement {
  constructor() {
    super();
    this.engine = window.engine;
    this.debugMode = 0; // Initialize debug mode to 0 (Normal)
  }

  connectedCallback() {
    super.connectedCallback();
    this.sub = appState.complectation.pipe(auditTime(100)).subscribe((res) => {
      if (this.lastLayout !== res.layout) {
        // Check if the layout has changed
        // this.createMaterialsFolder(res.layout);
        this.lastLayout = res.layout;
      }
    });
  }

  disconnectedCallback() {
    this.sub && this.sub.unsubscribe();
    this.cleanUpControllers();
  }

  async createMaterialsFolder(layout = appState.complectation.value.layout) {
    if (!this.gui) return;
    const selectedAsset = params.models.samara.assetsArray.find(
      (asset) => asset.name === appState.complectation.value.layout
    );
    await Promise.resolve(selectedAsset.loadedModel);

    let _materialsFolder = this.gui.folders.find(
      (folder) => folder._title === 'Materials'
    );

    if (!_materialsFolder) {
      _materialsFolder = this.gui.addFolder('Materials');
    } else {
      _materialsFolder.controllersRecursive().forEach((controller) => {
        controller.listen(false);
        controller.destroy();
      });
      _materialsFolder.destroy();
      _materialsFolder = this.gui.addFolder('Materials');
    }

    _materialsFolder.close();

    _materialsFolder
      .addFolder('Interior aomaps')
      .close()
      .add(params.maps.aoMap, 'intensity')
      .min(0.01)
      .max(2)
      .step(0.01)
      .onChange((value) => {
        this.engine.scene.traverse((mesh) => {
          if (
            mesh.material &&
            this.engine.models.materials.studioMaterials[mesh.material.name]
          ) {
            mesh.material.aoMapIntensity = value;
          }
        });
        this.engine.update();
      });

    _materialsFolder
      .addFolder('Interior lightmaps')
      .close()
      .add(params.maps.lightMap, 'intensity')
      .min(0.01)
      .max(20)
      .step(0.01)
      .onChange((value) => {
        this.engine.scene.traverse((mesh) => {
          if (
            mesh.material &&
            this.engine.models.materials.studioMaterials[mesh.material.name]
          ) {
            mesh.material.lightMapIntensity = value;
          }
        });
        this.engine.update();
      });
    const addedMaterialNames = new Set();

    const addMaterialPropertyListener = (
      prop,
      material,
      folder,
      min = 0,
      max = 20,
      step = 0.01
    ) => {
      if (
        material[prop] !== undefined &&
        material.materialType !== 'MeshTransmissionMaterial'
      )
        // Ensure property exists on the material
        prop === 'color'
          ? folder
              .addColor(material, 'color')
              .onChange(() => {
                this.engine.update();
              })
              .listen()
          : folder
              .add(material, prop, min, max, step)
              .onChange(() => {
                this.engine.update();
              })
              .listen();
    };

    const materialKeys = [
      'color',
      // 'depthWrite',
      // 'visible',
      // 'transmission',
      // 'metalness',
      // 'roughness',
      // 'ior',
      // 'thickness',
      // 'reflectivity',
      'aoMapIntensity',
      'lightMapIntensity',
    ];
    const layoutObject = this.engine.scene.getObjectByName(layout);

    layoutObject &&
      layoutObject.traverse((el) => {
        if (
          el.material &&
          !addedMaterialNames.has(el.material.name) &&
          el.material.lightMap
        ) {
          addedMaterialNames.add(el.material.name);
          const folder = _materialsFolder.addFolder(el.material.name).close();

          folder.$children.innerHTML = `<br/> ${
            el.material.materialType || el.material.type
          }`;
          materialKeys.forEach((key) => {
            addMaterialPropertyListener(key, el.material, folder);
          });

          const texturesFolder = folder.addFolder('Textures').close();
          texturesFolder.$children.innerHTML = `<button-component material="${el.material.name}" parent="${layoutObject.name}"></button-component>`;
        }
      });
  }

  cleanUpControllers() {
    if (this.gui) {
      const allControllers = this.gui.controllersRecursive();
      allControllers.forEach((controller) => {
        controller.listen(false);
        controller.destroy();
      });
      this.gui.destroy();
    }
  }

  onRef(div) {
    if (div) {
      this.guiDomEl = div;
      this.initGui();
    }
  }

  static get styles() {
    return css`
      .gui {
        position: absolute;
        top: 0;
        right: 1em;
        max-height: 100vh;
        overflow: auto;
        z-index: 3;
        border-bottom-left-radius: 1em;
        border-bottom-right-radius: 1em;
      }

      .lil-gui {
        --background-color: #1f1f1f;
        --text-color: #ebebeb;
        --title-background-color: #111;
        --title-text-color: #ebebeb;
        --widget-color: #424242;
        --hover-color: #4f4f4f;
        --focus-color: #595959;
        --number-color: #2cc9ff;
        --string-color: #a2db3c;
        --font-size: 11px;
        --input-font-size: 11px;
        --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Arial, sans-serif;
        --font-family-mono: Menlo, Monaco, Consolas, 'Droid Sans Mono',
          monospace;
        --padding: 4px;
        --spacing: 4px;
        --widget-height: 20px;
        --name-width: 45%;
        --slider-knob-width: 2px;
        --slider-input-width: 27%;
        --color-input-width: 27%;
        --slider-input-min-width: 45px;
        --color-input-min-width: 45px;
        --folder-indent: 7px;
        --widget-padding: 0 0 0 3px;
        --widget-border-radius: 2px;
        --checkbox-size: calc(var(--widget-height) * 0.75);
        --scrollbar-width: 5px;
        background-color: var(--background-color);
        color: var(--text-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-style: normal;
        font-weight: 400;
        line-height: 1;
        text-align: left;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }
      .lil-gui,
      .lil-gui * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .lil-gui.root {
        display: flex;
        flex-direction: column;
        width: var(--width, 245px);
      }
      .lil-gui.root > .title {
        background: var(--title-background-color);
        color: var(--title-text-color);
      }
      .lil-gui.root > .children {
        overflow-x: hidden;
        overflow-y: auto;
      }
      .lil-gui.root > .children::-webkit-scrollbar {
        background: var(--background-color);
        height: var(--scrollbar-width);
        width: var(--scrollbar-width);
      }
      .lil-gui.root > .children::-webkit-scrollbar-thumb {
        background: var(--focus-color);
        border-radius: var(--scrollbar-width);
      }
      .lil-gui.force-touch-styles {
        --widget-height: 28px;
        --padding: 6px;
        --spacing: 6px;
        --font-size: 13px;
        --input-font-size: 16px;
        --folder-indent: 10px;
        --scrollbar-width: 7px;
        --slider-input-min-width: 50px;
        --color-input-min-width: 65px;
      }
      .lil-gui.autoPlace {
        max-height: 100%;
        position: fixed;
        right: 15px;
        top: 0;
        z-index: 1001;
      }
      .lil-gui .controller {
        align-items: center;
        display: flex;
        margin: var(--spacing) 0;
        padding: 0 var(--padding);
      }
      .lil-gui .controller.disabled {
        opacity: 0.5;
      }
      .lil-gui .controller.disabled,
      .lil-gui .controller.disabled * {
        pointer-events: none !important;
      }
      .lil-gui .controller > .name {
        flex-shrink: 0;
        line-height: var(--widget-height);
        min-width: var(--name-width);
        padding-right: var(--spacing);
        white-space: pre;
      }
      .lil-gui .controller .widget {
        align-items: center;
        display: flex;
        min-height: var(--widget-height);
        position: relative;
        width: 100%;
      }
      .lil-gui .controller.string input {
        color: var(--string-color);
      }
      .lil-gui .controller.boolean .widget {
        cursor: pointer;
      }
      .lil-gui .controller.color .display {
        border-radius: var(--widget-border-radius);
        height: var(--widget-height);
        position: relative;
        width: 100%;
      }
      .lil-gui .controller.color input[type='color'] {
        cursor: pointer;
        height: 100%;
        opacity: 0;
        width: 100%;
      }
      .lil-gui .controller.color input[type='text'] {
        flex-shrink: 0;
        font-family: var(--font-family-mono);
        margin-left: var(--spacing);
        min-width: var(--color-input-min-width);
        width: var(--color-input-width);
      }
      .lil-gui .controller.option select {
        max-width: 100%;
        opacity: 0;
        position: absolute;
        width: 100%;
      }
      .lil-gui .controller.option .display {
        background: var(--widget-color);
        border-radius: var(--widget-border-radius);
        height: var(--widget-height);
        line-height: var(--widget-height);
        max-width: 100%;
        overflow: hidden;
        padding-left: 0.55em;
        padding-right: 1.75em;
        pointer-events: none;
        position: relative;
        word-break: break-all;
      }
      .lil-gui .controller.option .display.active {
        background: var(--focus-color);
      }
      .lil-gui .controller.option .display:after {
        bottom: 0;
        content: '↕';
        font-family: lil-gui;
        padding-right: 0.375em;
        position: absolute;
        right: 0;
        top: 0;
      }
      .lil-gui .controller.option .widget,
      .lil-gui .controller.option select {
        cursor: pointer;
      }
      .lil-gui .controller.number input {
        color: var(--number-color);
      }
      .lil-gui .controller.number.hasSlider input {
        flex-shrink: 0;
        margin-left: var(--spacing);
        min-width: var(--slider-input-min-width);
        width: var(--slider-input-width);
      }
      .lil-gui .controller.number .slider {
        background-color: var(--widget-color);
        border-radius: var(--widget-border-radius);
        cursor: ew-resize;
        height: var(--widget-height);
        overflow: hidden;
        padding-right: var(--slider-knob-width);
        touch-action: pan-y;
        width: 100%;
      }
      .lil-gui .controller.number .slider.active {
        background-color: var(--focus-color);
      }
      .lil-gui .controller.number .slider.active .fill {
        opacity: 0.95;
      }
      .lil-gui .controller.number .fill {
        border-right: var(--slider-knob-width) solid var(--number-color);
        box-sizing: content-box;
        height: 100%;
      }
      .lil-gui-dragging .lil-gui {
        --hover-color: var(--widget-color);
      }
      .lil-gui-dragging * {
        cursor: ew-resize !important;
      }
      .lil-gui-dragging.lil-gui-vertical * {
        cursor: ns-resize !important;
      }
      .lil-gui .title {
        --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
        -webkit-tap-highlight-color: transparent;
        text-decoration-skip: objects;
        cursor: pointer;
        font-weight: 600;
        height: var(--title-height);
        line-height: calc(var(--title-height) - 4px);
        outline: none;
        padding: 0 var(--padding);
      }
      .lil-gui .title:before {
        content: '▾';
        display: inline-block;
        font-family: lil-gui;
        padding-right: 2px;
      }
      .lil-gui .title:active {
        background: var(--title-background-color);
        opacity: 0.75;
      }
      .lil-gui.root > .title:focus {
        text-decoration: none !important;
      }
      .lil-gui.closed > .title:before {
        content: '▸';
      }
      .lil-gui.closed > .children {
        opacity: 0;
        transform: translateY(-7px);
      }
      .lil-gui.closed:not(.transition) > .children {
        display: none;
      }
      .lil-gui.transition > .children {
        overflow: hidden;
        pointer-events: none;
        transition-duration: 0.3s;
        transition-property: height, opacity, transform;
        transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
      }
      .lil-gui .children:empty:before {
        content: 'Empty';
        display: block;
        font-style: italic;
        height: var(--widget-height);
        line-height: var(--widget-height);
        margin: var(--spacing) 0;
        opacity: 0.5;
        padding: 0 var(--padding);
      }
      .lil-gui.root > .children > .lil-gui > .title {
        border-width: 0;
        border-bottom: 1px solid var(--widget-color);
        border-left: 0 solid var(--widget-color);
        border-right: 0 solid var(--widget-color);
        border-top: 1px solid var(--widget-color);
        transition: border-color 0.3s;
      }
      .lil-gui.root > .children > .lil-gui.closed > .title {
        border-bottom-color: transparent;
      }
      .lil-gui + .controller {
        border-top: 1px solid var(--widget-color);
        margin-top: 0;
        padding-top: var(--spacing);
      }
      .lil-gui .lil-gui .lil-gui > .title {
        border: none;
      }
      .lil-gui .lil-gui .lil-gui > .children {
        border: none;
        border-left: 2px solid var(--widget-color);
        margin-left: var(--folder-indent);
      }
      .lil-gui .lil-gui .controller {
        border: none;
      }
      .lil-gui input {
        -webkit-tap-highlight-color: transparent;
        background: var(--widget-color);
        border: 0;
        border-radius: var(--widget-border-radius);
        color: var(--text-color);
        font-family: var(--font-family);
        font-size: var(--input-font-size);
        height: var(--widget-height);
        outline: none;
        width: 100%;
      }
      .lil-gui input:disabled {
        opacity: 1;
      }
      .lil-gui input[type='number'],
      .lil-gui input[type='text'] {
        padding: var(--widget-padding);
      }
      .lil-gui input[type='number']:focus,
      .lil-gui input[type='text']:focus {
        background: var(--focus-color);
      }
      .lil-gui input::-webkit-inner-spin-button,
      .lil-gui input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .lil-gui input[type='number'] {
        -moz-appearance: textfield;
      }
      .lil-gui input[type='checkbox'] {
        appearance: none;
        -webkit-appearance: none;
        border-radius: var(--widget-border-radius);
        cursor: pointer;
        height: var(--checkbox-size);
        text-align: center;
        width: var(--checkbox-size);
      }
      .lil-gui input[type='checkbox']:checked:before {
        content: '✓';
        font-family: lil-gui;
        font-size: var(--checkbox-size);
        line-height: var(--checkbox-size);
      }
      .lil-gui button {
        -webkit-tap-highlight-color: transparent;
        background: var(--widget-color);
        border: 1px solid var(--widget-color);
        border-radius: var(--widget-border-radius);
        color: var(--text-color);
        cursor: pointer;
        font-family: var(--font-family);
        font-size: var(--font-size);
        height: var(--widget-height);
        line-height: calc(var(--widget-height) - 4px);
        outline: none;
        text-align: center;
        text-transform: none;
        width: 100%;
      }
      .lil-gui button:active {
        background: var(--focus-color);
      }
      @font-face {
        font-family: lil-gui;
        src: url('data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==')
          format('woff');
      }
      @media (pointer: coarse) {
        .lil-gui.allow-touch-styles {
          --widget-height: 28px;
          --padding: 6px;
          --spacing: 6px;
          --font-size: 13px;
          --input-font-size: 16px;
          --folder-indent: 10px;
          --scrollbar-width: 7px;
          --slider-input-min-width: 50px;
          --color-input-min-width: 65px;
        }
      }
      @media (hover: hover) {
        .lil-gui .controller.color .display:hover:before {
          border: 1px solid #fff9;
          border-radius: var(--widget-border-radius);
          bottom: 0;
          content: ' ';
          display: block;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }
        .lil-gui .controller.option .display.focus {
          background: var(--focus-color);
        }
        .lil-gui .controller.option .widget:hover .display {
          background: var(--hover-color);
        }
        .lil-gui .controller.number .slider:hover {
          background-color: var(--hover-color);
        }
        .lil-gui .title:hover {
          background: var(--title-background-color);
          opacity: 0.85;
        }
        .lil-gui .title:focus {
          text-decoration: underline var(--focus-color);
        }
        .lil-gui input:hover {
          background: var(--hover-color);
        }
        .lil-gui input:active {
          background: var(--focus-color);
        }
        .lil-gui input[type='checkbox']:focus {
          box-shadow: inset 0 0 0 1px var(--focus-color);
        }
        .lil-gui button:hover {
          background: var(--hover-color);
          border-color: var(--hover-color);
        }
        .lil-gui button:focus {
          border-color: var(--focus-color);
        }
      }
    `;
  }

  render() {
    return html`<div class="gui" ${ref(this.onRef)}></div>`;
  }

  initGui() {
    this.gui = new GUI({
      load: JSON,
      autoPlace: false,
      container: this.guiDomEl,
    });
    this.gui.close();

    this.guiDomEl.appendChild(this.gui.domElement);

    // Stats

    // this.engine.stats = Stats();

    // const _statsFolder = this.gui.addFolder('Performance');
    // this.engine.stats.dom.style.position = 'relative';
    // _statsFolder.$children.appendChild(this.engine.stats.dom);
    // _statsFolder.close();

    // Animation
    const _animationFolder = this.gui.addFolder('Animation').close();

    const easings = {
      Linear: Linear.easeNone,
      Power0: Power0.easeNone,
      'Power1.easeIn': Power1.easeIn,
      'Power1.easeOut': Power1.easeOut,
      'Power1.easeInOut': Power1.easeInOut,
      'Power2.easeIn': Power2.easeIn,
      'Power2.easeOut': Power2.easeOut,
      'Power2.easeInOut': Power2.easeInOut,
      'Power3.easeIn': Power3.easeIn,
      'Power3.easeOut': Power3.easeOut,
      'Power3.easeInOut': Power3.easeInOut,
      'Power4.easeIn': Power4.easeIn,
      'Power4.easeOut': Power4.easeOut,
      'Power4.easeInOut': Power4.easeInOut,
      'Back.easeIn': Back.easeIn,
      'Back.easeOut': Back.easeOut,
      'Back.easeInOut': Back.easeInOut,
      'Elastic.easeIn': Elastic.easeIn,
      'Elastic.easeOut': Elastic.easeOut,
      'Elastic.easeInOut': Elastic.easeInOut,
      'Bounce.easeIn': Bounce.easeIn,
      'Bounce.easeOut': Bounce.easeOut,
      'Bounce.easeInOut': Bounce.easeInOut,
      'Circ.easeIn': Circ.easeIn,
      'Circ.easeOut': Circ.easeOut,
      'Circ.easeInOut': Circ.easeInOut,
      'Expo.easeIn': Expo.easeIn,
      'Expo.easeOut': Expo.easeOut,
      'Expo.easeInOut': Expo.easeInOut,
      'Sine.easeIn': Sine.easeIn,
      'Sine.easeOut': Sine.easeOut,
      'Sine.easeInOut': Sine.easeInOut,
    };

    const easeProxy = {
      get ease() {
        return params.animation.move.easeName;
      },
      set ease(value) {
        params.animation.move.easeName = value;
        params.animation.move.ease = easings[value];
      },
    };

    const moveEaseProxy = {
      get ease() {
        return params.animation.move.easeName;
      },
      set ease(value) {
        params.animation.move.easeName = value;
        params.animation.move.ease = easings[value];
      },
    };

    const _moveAnimationFolder = _animationFolder.addFolder('Move');

    _moveAnimationFolder
      .add(moveEaseProxy, 'ease', Object.keys(easings))
      .name('Ease')
      .onChange((value) => {
        moveEaseProxy.ease = value;
      });

    _moveAnimationFolder
      .add(params.animation.move, 'duration', 0, 5)
      .onChange((value) => {})
      .name('Duration');
  }
}

customElements.define('gui-component', GuiComponent);

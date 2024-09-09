import {
  Color,
  PerspectiveCamera,
  Scene,
  AmbientLight,
  WebGLRenderer,
  Mesh,
  Vector3,
} from 'three';
import { Textures } from './textures';
import { cameraControls } from './controls';
import gsap, { Linear } from 'gsap';
import { params } from './settings';
import { MathUtils } from './libs/math';
import { CameraGsap } from './camera-gsap';
import { appState } from '../services/app-state';
import { safeMerge } from '../utils/safe-merge';
import { Model } from './model';
import { Tests } from './tests';

import { fromEvent, merge, timer } from 'rxjs';
import {
  auditTime,
  map,
  mapTo,
  share,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { delayMs } from '../utils/delay';
import { Assets } from './assets';
import { Options } from '../services/options';
import { Plan } from './addons/plan';
import { Labels } from './addons/labels';
import { CursorPin } from './addons/cursorpin';

import { CubeMap } from './addons/cubemap';
import { Mirrors } from './addons/mirrors';
import { PostProcessing } from './post-processing';
import * as THREE from 'three';
import { Panorama } from './addons/panorama';
let hasMouseMoved = false;

/** Main class for 3d scene */
export class CreateScene {
  constructor(settings) {
    if (settings) {
      safeMerge(params, settings);
    }
  }

  /**
   * Initialize scene and start rendering
   */

  async init(reInit) {
    if (reInit || this.renderer) {
      params.container.appendChild(this.renderer.domElement);
      this.cameraControls.initControls(true);
      this.onResize();
      this.initListeners();
      this.addSubs();
      this.startRendering();
    } else {
      this.textures = new Textures();
      this.options = new Options();
      this.render = (time, deltaTime, frame) =>
        this.animate(time, deltaTime, frame);

      this.renderer = new WebGLRenderer({
        antialias: params.renderer.defaultRenderer.antialias,
        alpha: params.renderer.defaultRenderer.alpha,
        premultipliedAlpha: true,
        // stencil: false,
        // depth: false,
      });

      this.renderer.setClearColor(0x000000, 0.0);
      this.renderer.setPixelRatio(params.renderer.pixelRatio);
      this.renderer.physicallyCorrectLights = true;

      this.renderer.outputColorSpace = params.renderer.outputEncoding;
      this.renderer.toneMappingExposure = params.renderer.exposure;
      this.renderer.toneMapping = params.renderer.toneMapping;
      this.scene = new Scene();

      this.camera = new PerspectiveCamera(
        params.camera.fov,
        params.container.clientWidth / params.container.clientHeight,
        params.camera.near,
        params.camera.far
      );

      this.camera.position.set(
        params.camera.initPos.x,
        params.camera.initPos.y,
        params.camera.initPos.z
      );

      this.camera.zoom = params.controls.thirdPerson.defaultZoom;

      this.cameraControls = new cameraControls(this);

      params.container.appendChild(this.renderer.domElement);
      this.cameraControls.initControls();

      this.ambientLight = new AmbientLight(0xffffff, params.light.intensity);
      this.scene.add(this.ambientLight);

      this.models = new Model(this);
      this.textures.init(this);

      this.assets = new Assets(this);

      // Load and setup assets asynchronously.
      await this.assets.loadAndSetup();
      params.loadOnDemand.loadingManager.enabled = false;

      // Load and setup additional assets.
      this.assets.loadAndSetupRest();

      this.renderer.compile(this.scene, this.camera);

      this.CameraGsap = new CameraGsap();
      this.postprocessing = new PostProcessing(this);
      this.postprocessing.init();
      this.CameraGsap.setDefaultCam();

      this.initListeners();
      this.setupPerspectiveView();
      this.onResize();
      this.addSubs();
      this.startRendering();
      await delayMs(1);

      this.tests = new Tests(this);
      this.plan = new Plan(this);

      this.panorama = new Panorama(this);
      this.panorama.setup();
      this.cursor = new CursorPin(this);

      this.labels = new Labels(this);
      this.labels.addLabels();

      // this.cubemap = new CubeMap(this);
      // this.reflector = new Mirrors(this);

      // this.showOverlayWithTextAnimation('Samara room tour');

      // this.tests.testContextLoss(5);
      // this.tests.testDestroy(5);
      // this.tests.testRandomComplectation(500);
      // this.tests.testLayoutChange(50);
      this.CameraGsap.setCam('bed');

      await delayMs(1);
      appState.loading.next({ isLoading: false });
    }
  }

  showOverlayWithTextAnimation(text) {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(224, 222, 212, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.opacity = '1'; // Initial opacity

    // Create text container
    const overlayText = document.createElement('div');
    overlayText.id = 'overlayText';
    overlayText.style.color = 'black';
    overlayText.style.fontSize = '3em';
    overlayText.style.fontFamily = 'Sans-Serif';
    overlayText.style.textAlign = 'center';

    // Append text container to overlay
    overlay.appendChild(overlayText);
    document.body.appendChild(overlay);

    // Split text into individual letters and append to text container
    text.split('').forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      overlayText.appendChild(span);
    });

    // Animate each letter
    gsap.fromTo(
      overlayText.children,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        onComplete: () => {
          // Smoothly hide overlay
          gsap.to(overlay, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
              // Remove overlay after it is hidden
              document.body.removeChild(overlay);
            },
          });
        },
      }
    );
  }

  /**
   * Method to pause rendering (for route or tab change)
   */

  pauseRendering() {
    gsap.ticker.remove(this.render);
  }

  /**
   * Method to start rendering.
   * @param {Boolean} once - The callback will only fire once and then get removed automatically
   * @param {Boolean} useRAF - Whether to use requestAnimationFrame for rendering.
   */

  startRendering(once = false, useRAF = true) {
    gsap.ticker.add(this.render, once, useRAF);
  }

  /**
   * Method used on route leave
   */

  destroy() {
    this.sub.unsubscribe();
    this.removeListeners();
    this.pauseRendering();
  }

  addSubs() {
    this.sub = appState.complectation.subscribe((res) => {
      this.onComplectationChange();
    });
    /**
     * Handle user activity and pause/resume rendering
     */
    const mouseMoveEvent = fromEvent(params.container, 'mousemove');
    const keyPressEvent = fromEvent(params.container, 'keyup');
    const touchStartEvent = fromEvent(params.container, 'touchstart');

    const interval = timer(3000);
    const extendedInterval = timer(5000);

    this.sub.add(
      merge(
        keyPressEvent,
        mouseMoveEvent,
        touchStartEvent,
        appState.renderingStatus
      ).subscribe(() => {
        if (!this.renderingActive) {
          this.startRendering();
          this.renderingActive = true;
        }
      })
    );

    this.sub.add(
      merge(
        keyPressEvent,
        mouseMoveEvent,
        touchStartEvent,
        appState.renderingStatus
      )
        .pipe(
          startWith('initial'),
          switchMap(() => {
            return merge(
              interval.pipe(mapTo(0)),
              extendedInterval.pipe(mapTo(1))
            );
          })
        )
        .subscribe((value) => {
          if (value === 0) {
            // Perform action for regular inactivity time
            if (this.renderingActive) {
              this.pauseRendering();
              this.renderingActive = false;
            }
          } else {
            // Perform action for extended inactivity time
          }
        })
    );
  }

  initListeners() {
    this.listeners = [
      {
        eventTarget: params.container,
        eventName: 'mousedown',
        eventFunction: () => {
          hasMouseMoved = false;
        },
      },

      // Listener for mouse move to set the movement flag
      {
        eventTarget: params.container,
        eventName: 'mousemove',
        eventFunction: (e) => {
          hasMouseMoved = true;
          this.cursor.onMove(e);
        },
      },

      // Modify the mouseup listener to check the movement flag
      {
        eventTarget: params.container,
        eventName: 'mouseup',
        eventFunction: (e) => {
          if (!hasMouseMoved) {
            this.cursor.onClick(e);
          }
        },
      },
      {
        eventTarget: document,
        eventName: 'visibilitychange',
        eventFunction: () => this.onVisibilityChange(),
      },
      {
        eventTarget: this.renderer.domElement,
        eventName: 'webglcontextlost',
        eventFunction: () => this.onContextLoss(),
      },
      {
        eventTarget: this.renderer.domElement,
        eventName: 'webglcontextrestored',
        eventFunction: () => this.onContextRestored(),
      },
      {
        eventTarget: window,
        eventName: 'resize',
        eventFunction: () => this.onResize(),
      },
      {
        eventTarget: this.controls,
        eventName: 'sleep',
        eventFunction: () => this.onControlsEnd(),
      },
      {
        eventTarget: this.controls,
        eventName: 'change',
        eventFunction: () => this.onControlsUpdate(),
      },
      {
        eventTarget: this.controls,
        eventName: 'update',
        eventFunction: () => this.onControlsUpdate(),
      },
      {
        eventTarget: this.controls,
        eventName: 'end',
        eventFunction: () => this.onControlsEnd(),
      },
    ];

    this.listeners.forEach((listener) => {
      listener.eventTarget.addEventListener(
        listener.eventName,
        listener.eventFunction
      );
    });
  }

  onControlsUpdate() {
    // console.log(this.controls.getPosition());
    // console.log(this.controls.getTarget());
    this.panoMesh && this.panoMesh.position.copy(this.controls.getPosition());
  }

  onControlsEnd() {
    appState.renderingStatus.next(false);
  }

  removeListeners() {
    this.listeners.forEach((listener) => {
      listener.eventTarget.removeEventListener(
        listener.eventName,
        listener.eventFunction
      );
    });
  }

  onVisibilityChange() {
    document.visibilityState === 'visible'
      ? this.startRendering()
      : this.pauseRendering();
  }

  materialGsap(obj, materials, materialNames) {
    const tlObj = {
      duration: 0.01,
      onUpdate: () => appState.renderingStatus.next(true),
      onComplete: () => appState.renderingStatus.next(false),
    };

    if (obj.name === 'color') {
      const color = new Color(obj.value);
      tlObj.r = color.r;
      tlObj.g = color.g;
      tlObj.b = color.b;
    } else {
      tlObj[obj.name] = obj.value;
    }
    const objectToAnimate = [];

    if (materials && materials.length > 0) {
      materials
        .filter((material) => material !== undefined)
        .forEach((material) => {
          objectToAnimate.push(
            obj.name === 'color' ? material.color : material
          );
        });
    }

    if (Array.isArray(materialNames)) {
      this.scene.traverse((mesh) => {
        if (
          mesh instanceof Mesh &&
          mesh.material &&
          materialNames.includes(mesh.material.name)
        ) {
          objectToAnimate.push(
            obj.name === 'color' ? mesh.material.color : mesh.material
          );
        }
      });
    }

    objectToAnimate.length > 0 && gsap.timeline().to(objectToAnimate, tlObj);
  }

  setupPerspectiveView() {
    const scaleInt =
      params.camera.fov / params.models.samara.modelScaleAspectValue;

    this.scene.scale.set(scaleInt * 3.33, scaleInt * 3.33, scaleInt * 3.33);

    this.camera.fov = params.camera.fov;
    this.camera.updateProjectionMatrix();
    this.update();
  }

  onResize() {
    const width = params.container.clientWidth;
    const height = params.container.clientHeight;

    this.renderer.setSize(width, height);
    this.postprocessing.composer.setSize(width, height);

    this.camera.aspect = width / height;

    const aspectValue =
      width < height
        ? params.camera.portraitAspect
        : params.camera.landscapeAspect;

    if (this.camera.aspect > aspectValue) {
      this.camera.fov = params.camera.fov;
    } else {
      const cameraHeight = Math.tan(MathUtils.degToRad(params.camera.fov / 2));
      const ratio = this.camera.aspect / aspectValue;
      const newCameraHeight = cameraHeight / ratio;
      this.camera.fov = MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
    }

    this.camera.updateProjectionMatrix();
    this.labels && this.labels.onResize(width, height);
    this.update();
  }

  /**
   * @deprecated
   */
  renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }

  async onContextLoss() {
    appState.errors.next({
      isError: true,
      message: 'Restoring context, please wait.',
    });

    await delayMs(1);
    this.renderer.forceContextRestore();
  }

  async onContextRestored() {
    // Reset HDR textures

    params.environment.assetsArray.forEach((asset) => {
      asset.loadedHDRTexture = null;
    });

    // Find the default asset
    const defaultAsset = params.environment.assetsArray.find(
      (asset) => asset.isDefault
    );

    // Load the default HDR texture
    await this.textures.loadTexture(defaultAsset, 'pmrem');

    // Update materials with the new HDR texture
    this.scene.traverse((object) => {
      if (object.material && object.material.envMap) {
        object.material.envMap = this.textures.getHdrTexture(defaultAsset.name);
        object.material.envMapIntensity = defaultAsset.defaultHdrIntensity;
      }
    });

    const updateMaterial = (material) => {
      material.needsUpdate = true;
      for (const key in material)
        if (material[key] && material[key].isTexture && key !== 'envMap') {
          material[key].needsUpdate = true;
        }
    };
    this.scene.traverse((object) => {
      if (object.geometry) {
        for (const key in object.geometry.attributes) {
          object.geometry.attributes[key].needsUpdate = true;
        }
        if (object.geometry.index) {
          object.geometry.index.needsUpdate = true;
        }
      }
      if (object.material) {
        if (object.material.length) {
          object.material.forEach(updateMaterial);
        } else {
          updateMaterial(object.material);
        }
      }
    });

    this.update();

    appState.errors.next({
      isError: false,
    });
  }

  /**
   * Method to get app params
   */

  getParams() {
    return params;
  }

  /**
   * Method to get app state
   */

  getState() {
    return appState;
  }

  /**
   * Method to get loading state
   * @return {Loading}
   */

  status() {
    return appState.loading;
  }

  update(time = 0.1) {
    const obj = {
      val: 0,
    };

    gsap.timeline().to(obj, {
      val: 1,
      duration: time,
      onStart: () => appState.renderingStatus.next(true),
      onUpdate: () => appState.renderingStatus.next(true),
      onComplete: () => appState.renderingStatus.next(false),
    });
  }

  animate(time, deltaTime, frame) {
    const delta = deltaTime / 1000;
    this.controls && this.controls.update(delta);

    if (params.postProcessing.enabled) {
      this.postprocessing.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.cursor && this.cursor.update();

    // this.reflector.update();
    this.models.materials.transmissiveMaterials.forEach((material) => {
      material.time += delta;
    });

    this.stats && this.stats.update();
  }

  /**
   * @deprecated
   */

  setOption(obj) {
    this.options.setOption(obj);
  }

  async onComplectationChange() {
    const complectation = appState.complectation.value;
    /**
     * Wait until the specified layout model object is loaded and setup is complete.
     */
    if (!this.models.getAssets(complectation.layout)) {
      await this.assets.checkAssetLoadedAndSetupComplete(complectation.layout);
    }

    const getMaterialByName = (name) => {
      return this.models.materials.allMaterials.get(name);
    };

    params.models.samara.complectationVars['Support'].variants.forEach(
      (variant) => {
        if (variant.name === complectation.support) {
          this.materialGsap(
            { name: 'color', value: variant.hex },
            [
              'Color_ExteriorSupp_onebed',
              'Color_ExteriorSupp_twobed',
              'Color_ExteriorSupp_XL 8',
              'Color_ExteriorSupp_studio',
            ].map((materialName) => getMaterialByName(materialName))
          );
        }
      }
    );

    params.models.samara.complectationVars['Color'].variants.forEach(
      (variant) => {
        if (
          variant.name === complectation.color.name ||
          variant.name === complectation.color
        ) {
          this.materialGsap(
            { name: 'color', value: variant.hex },
            [
              'Base Color Material_onebed',
              'Base Color Material_twobed',
              'Base Color Material_XL 8',
              'Base Color Material_studio',
              'Base Color Wood Material_onebed',
              'Base Color Wood Material_twobed',
              'Base Color Wood Material_XL 8',
              'Base Color Wood Material_studio',
            ].map((materialName) => getMaterialByName(materialName))
          );
        }
      }
    );

    params.models.samara.complectationVars['Roof'].variants.forEach(
      (variant) => {
        if (
          variant.name === complectation.roof.name ||
          variant.name === complectation.roof
        ) {
          this.materialGsap(
            { name: 'color', value: variant.hex },
            [
              'Roof Material_onebed',
              'Roof Material_studio',
              'Roof Material_twobed',
              'Roof Material_XL 8',
            ].map((materialName) => getMaterialByName(materialName))
          );
        }
      }
    );

    this.materialGsap(
      {
        name: 'metalness',
        value: complectation.roof.name === 'Metallic Silver Roof' ? 1 : 0.5,
      },
      [
        'Roof Material_onebed',
        'Roof Material_studio',
        'Roof Material_twobed',
        'Roof Material_XL 8',
      ].map((materialName) => getMaterialByName(materialName))
    );

    this.materialGsap(
      {
        name: 'roughness',
        value: complectation.roof.name === 'Metallic Silver Roof' ? 0.4 : 0.5,
      },
      [
        'Roof Material_onebed',
        'Roof Material_studio',
        'Roof Material_twobed',
        'Roof Material_XL 8',
      ].map((materialName) => getMaterialByName(materialName))
    );

    if (complectation.changedValue === 'layout') {
      this.CameraGsap.setDefaultCam();
    }

    this.models.traverse((object) => {
      if (
        [
          'onebed_shadow',
          'studio_shadow',
          'twobed_shadow',
          'XL 8_shadow',
        ].includes(object.name)
      ) {
        const layoutName = object.name.split('_')[0];
        object.visible = layoutName === complectation.layout;
      }

      if (
        ['twobed', 'onebed', 'studio', 'XL 8'].some(
          (name) => name === object.name
        )
      ) {
        object.visible = object.name === complectation.layout;
      }

      if (
        ['Socket_e_Front_2B', 'Socket_e_Front_1B', 'Socket_e_Front_S'].includes(
          object.name
        )
      ) {
        object.visible = complectation.front === 'double doors';
      }

      if (
        ['Socket_e_Left_2B', 'Socket_e_Left_1B', 'Socket_e_Left_S'].includes(
          object.name
        )
      ) {
        object.visible = complectation.left === 'left-doors';
      }

      if (object.name.includes('_Metal')) {
        object.visible = complectation.trim === 'metal';
      }

      if (object.name.includes('_Wood')) {
        object.visible = complectation.trim === 'wood';
      }

      if (object.name === 'LWRWR_2BA') {
        object.visible =
          complectation['living room'] === 'window' &&
          complectation['secondary bedroom'] === 'window';
      }

      if (object.name === 'LDRWR_2BA') {
        object.visible =
          complectation['living room'] === 'window' &&
          complectation['secondary bedroom'] === 'double doors';
      }

      if (object.name === 'LWRDR_2BA') {
        object.visible =
          complectation['living room'] === 'double doors' &&
          complectation['secondary bedroom'] === 'window';
      }

      if (object.name === 'LDRDR_Rear_2BA') {
        object.visible =
          complectation['living room'] === 'double doors' &&
          complectation['secondary bedroom'] === 'double doors';
      }

      if (
        object.material &&
        object.material.name === 'Base Color Wood Material_onebed'
      ) {
        if (
          ['solar-half', 'solar-full'].includes(complectation.solar) &&
          complectation.cables === 'cables-full'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_onebed'
          );
        }

        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_onebed_nosolar'
          );
        }

        if (
          complectation.cables === 'no-cables' &&
          complectation.solar !== 'no-solar'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_onebed_solar_no_cables'
          );
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Material_onebed'
      ) {
        if (
          ['solar-half', 'solar-full'].includes(complectation.solar) &&
          complectation.cables === 'cables-full'
        ) {
          object.material.aoMap =
            this.textures.getTexture('exterior_ao_onebed');
        }

        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_onebed_nosolar'
          );
        }

        if (
          complectation.cables === 'no-cables' &&
          complectation.solar !== 'no-solar'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_onebed_solar_no_cables'
          );
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Wood Material_twobed'
      ) {
        if (
          ['solar-half', 'solar-full'].includes(complectation.solar) &&
          complectation.cables === 'cables-full'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_twobed'
          );
        }

        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_twobed_nosolar'
          );
        }

        if (
          complectation.cables === 'no-cables' &&
          complectation.solar !== 'no-solar'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_wood_twobed_solar_no_cables'
          );
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Material_XL 8'
      ) {
        if (['solar-half', 'solar-full'].includes(complectation.solar)) {
          object.material.aoMap = this.textures.getTexture('AO_2BA_M_1');
        }
        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture('AO_2BA_M');
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Wood Material_XL 8'
      ) {
        if (['solar-half', 'solar-full'].includes(complectation.solar)) {
          object.material.aoMap = this.textures.getTexture('AO_2BA_W_1');
        }
        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture('AO_2BA_W');
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Material_twobed'
      ) {
        if (
          ['solar-half', 'solar-full'].includes(complectation.solar) &&
          complectation.cables === 'cables-full'
        ) {
          object.material.aoMap =
            this.textures.getTexture('exterior_ao_twobed');
        }

        if (complectation.solar === 'no-solar') {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_twobed_nosolar'
          );
        }

        if (
          complectation.cables === 'no-cables' &&
          complectation.solar !== 'no-solar'
        ) {
          object.material.aoMap = this.textures.getTexture(
            'exterior_ao_twobed_solar_no_cables'
          );
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Wood Material_studio'
      ) {
        if (complectation.right === 'double doors') {
          if (
            ['solar-half', 'solar-full'].includes(complectation.solar) &&
            complectation.cables === 'cables-full'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'exterior_ao_wood_studio'
            );
          }

          if (complectation.solar === 'no-solar') {
            object.material.aoMap = this.textures.getTexture(
              'exterior_ao_wood_studio_nosolar'
            );
          }

          if (
            complectation.cables === 'no-cables' &&
            complectation.solar !== 'no-solar'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'exterior_ao_wood_studio_no_cables'
            );
          }
        }
        if (complectation.right === 'window') {
          if (
            ['solar-half', 'solar-full'].includes(complectation.solar) &&
            complectation.cables === 'cables-full'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_wood_stairs_solar'
            );
          }

          if (complectation.solar === 'no-solar') {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_wood_stairs_no_solar'
            );
          }

          if (
            complectation.cables === 'no-cables' &&
            complectation.solar !== 'no-solar'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_wood_stairs_solar_no_cables'
            );
          }
        }
      }

      if (
        object.material &&
        object.material.name === 'Base Color Material_studio'
      ) {
        if (complectation.right === 'double doors') {
          if (
            ['solar-half', 'solar-full'].includes(complectation.solar) &&
            complectation.cables === 'cables-full'
          ) {
            object.material.aoMap =
              this.textures.getTexture('exterior_ao_studio');
          }

          if (complectation.solar === 'no-solar') {
            object.material.aoMap = this.textures.getTexture(
              'exterior_ao_studio_nosolar'
            );
          }

          if (
            complectation.cables === 'no-cables' &&
            complectation.solar !== 'no-solar'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'exterior_ao_studio_no_cables'
            );
          }
        }
        if (complectation.right === 'window') {
          if (
            ['solar-half', 'solar-full'].includes(complectation.solar) &&
            complectation.cables === 'cables-full'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_stairs_solar'
            );
          }

          if (complectation.solar === 'no-solar') {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_stairs_no_solar'
            );
          }

          if (
            complectation.cables === 'no-cables' &&
            complectation.solar !== 'no-solar'
          ) {
            object.material.aoMap = this.textures.getTexture(
              'studio_exterior_ao_stairs_solar_no_cables'
            );
          }
        }
      }

      if (
        [
          'CableConduit_1B',
          'CableConduit_S',
          'CableConduit_2B',
          'Tube_Full_1B',
          'Tube_Half_1B',
          'Tube_Full_2B',
          'Tube_Half_2B',
        ].includes(object.name)
      ) {
        object.visible =
          complectation.cables !== 'no-cables' &&
          ['solar-half', 'solar-full'].includes(complectation.solar);
      }

      if (object.material && object.material.name === 'Roof Material_onebed') {
        if (complectation.cables === 'cables-full') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_onebed'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_onebed'
            ));
        }

        complectation.solar === 'no-solar' &&
          (object.material.aoMap = this.textures.getTexture(
            'roof_solar_none_ao_onebed'
          ));
        if (complectation.cables === 'no-cables') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_onebed_no_cables'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_onebed_no_cables'
            ));
        }
      }

      if (object.material && object.material.name === 'Roof Material_twobed') {
        if (complectation.cables === 'cables-full') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_twobed'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_twobed'
            ));
        }

        complectation.solar === 'no-solar' &&
          (object.material.aoMap = this.textures.getTexture(
            'roof_solar_none_ao_twobed'
          ));

        if (complectation.cables === 'no-cables') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_twobed_no_cables'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_twobed_no_cables'
            ));
        }
      }

      if (object.material && object.material.name === 'Roof Material_XL 8') {
        complectation.solar === 'solar-full' &&
          (object.material.aoMap = this.textures.getTexture('Roof_2BA_Full'));
        complectation.solar === 'solar-half' &&
          (object.material.aoMap = this.textures.getTexture('Roof_2BA_One'));
        complectation.solar === 'no-solar' &&
          (object.material.aoMap = this.textures.getTexture('Roof_2BA_Clear'));
      }

      if (object.material && object.material.name === 'Roof Material_studio') {
        if (complectation.cables === 'cables-full') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_studio'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_studio'
            ));
        }

        complectation.solar === 'no-solar' &&
          (object.material.aoMap = this.textures.getTexture(
            'roof_solar_none_ao_studio'
          ));

        if (complectation.cables === 'no-cables') {
          complectation.solar === 'solar-full' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_full_ao_studio_no_cables'
            ));
          complectation.solar === 'solar-half' &&
            (object.material.aoMap = this.textures.getTexture(
              'roof_solar_half_ao_studio_no_cables'
            ));
        }
      }

      if (object.name === 'studio_shadow') {
        if (
          complectation.front === 'window' &&
          complectation.left === 'window' &&
          complectation.right === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('1_S');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'window' &&
          complectation.right === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('2_S');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'double doors' &&
          complectation.right === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('3_S');
        } else if (
          complectation.front === 'window' &&
          complectation.left === 'double doors' &&
          complectation.right === 'window'
        ) {
          object.material.map = this.textures.getTexture('4_S');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'window' &&
          complectation.right === 'window'
        ) {
          object.material.map = this.textures.getTexture('5_S');
        } else if (
          complectation.front === 'window' &&
          complectation.left === 'window' &&
          complectation.right === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('6_S');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'double doors' &&
          complectation.right === 'window'
        ) {
          object.material.map = this.textures.getTexture('6_S');
        } else if (
          complectation.front === 'window' &&
          complectation.left === 'double doors' &&
          complectation.right === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('4_S');
        }
      }

      if (object.name === 'onebed_shadow') {
        if (
          complectation.front === 'window' &&
          complectation.left === 'window'
        ) {
          object.material.map = this.textures.getTexture('1_1B');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'window'
        ) {
          object.material.map = this.textures.getTexture('2_1B');
        } else if (
          complectation.left === 'double doors' &&
          complectation.front === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('3_1B');
        } else if (
          complectation.left === 'double doors' &&
          complectation.front === 'window'
        ) {
          object.material.map = this.textures.getTexture('4_1B');
        }
      }

      if (object.name === 'twobed_shadow') {
        if (
          complectation.front === 'window' &&
          complectation.left === 'window'
        ) {
          object.material.map = this.textures.getTexture('4_2B');
        } else if (
          complectation.front === 'double doors' &&
          complectation.left === 'window'
        ) {
          object.material.map = this.textures.getTexture('1_2B');
        } else if (
          complectation.left === 'double doors' &&
          complectation.front === 'double doors'
        ) {
          object.material.map = this.textures.getTexture('2_2B');
        } else if (
          complectation.left === 'double doors' &&
          complectation.front === 'window'
        ) {
          object.material.map = this.textures.getTexture('3_2B');
        }
      }

      if (object.name === 'XL 8_shadow') {
        if (complectation['primary bedroom'] === 'window') {
          if (
            complectation['living room'] === 'window' &&
            complectation['secondary bedroom'] === 'window'
          ) {
            object.material.map = this.textures.getTexture('1_2BA');
          }

          if (
            complectation['living room'] === 'double doors' &&
            complectation['secondary bedroom'] === 'window'
          ) {
            object.material.map = this.textures.getTexture('2_2BA');
          }

          if (
            complectation['living room'] === 'window' &&
            complectation['secondary bedroom'] === 'double doors'
          ) {
            object.material.map = this.textures.getTexture('3_2BA');
          }

          if (
            complectation['living room'] === 'double doors' &&
            complectation['secondary bedroom'] === 'double doors'
          ) {
            object.material.map = this.textures.getTexture('4_2BA');
          }
        }

        if (complectation['primary bedroom'] === 'double doors') {
          if (
            complectation['living room'] === 'window' &&
            complectation['secondary bedroom'] === 'window'
          ) {
            object.material.map = this.textures.getTexture('5_2BA');
          }

          if (
            complectation['living room'] === 'double doors' &&
            complectation['secondary bedroom'] === 'window'
          ) {
            object.material.map = this.textures.getTexture('6_2BA');
          }

          if (
            complectation['living room'] === 'window' &&
            complectation['secondary bedroom'] === 'double doors'
          ) {
            object.material.map = this.textures.getTexture('7_2BA');
          }

          if (
            complectation['living room'] === 'double doors' &&
            complectation['secondary bedroom'] === 'double doors'
          ) {
            object.material.map = this.textures.getTexture('8_2BA');
          }
        }
      }

      if (['DoubleDoor_Front_2BA'].includes(object.name)) {
        object.visible = complectation['primary bedroom'] === 'double doors';
      }

      if (['Window_Front_2BA'].includes(object.name)) {
        object.visible = complectation['primary bedroom'] === 'window';
      }

      if (
        [
          'DoubleDoor_Front_S',
          'DoubleDoor_Front_1B',
          'DoubleDoor_Front_2B',
        ].includes(object.name)
      ) {
        object.visible = complectation.front === 'double doors';
      }

      if (
        ['Baseline_Front_1B', 'Baseline_Front_S', 'Baseline_Front_2B'].includes(
          object.name
        )
      ) {
        object.visible = complectation.front === 'window';
      }

      if (
        [
          'DoubleDoor_Left_S',
          'DoubleDoor_Left_1B',
          'DoubleDoor_Left_2B',
        ].includes(object.name)
      ) {
        object.visible = complectation.left === 'double doors';
      }

      if (
        ['Baseline_Left_1B', 'Baseline_Left_S', 'Baseline_Left_2B'].includes(
          object.name
        )
      ) {
        object.visible = complectation.left === 'window';
      }

      if (['DoubleDoor_Right_2BA'].includes(object.name)) {
        object.visible = complectation.front === 'double doors';
      }

      if (['Window_Right_2BA'].includes(object.name)) {
        object.visible = complectation.front === 'window';
      }

      if (['Door_Right_S'].includes(object.name)) {
        object.visible = complectation.right === 'double doors';
      }

      if (['Window_Right_S'].includes(object.name)) {
        object.visible = complectation.right === 'window';
      }

      if (['Undersructure_Front_S', 'Deck_Front_S'].includes(object.name)) {
        object.visible = complectation.right === 'double doors';
      }

      if (
        [
          'SolarPanel_Right_1B',
          'SolarPanel_Right_S',
          'SolarPanel_Right_2B',
        ].includes(object.name)
      ) {
        object.visible = complectation.solar === 'solar-full';
      }

      if (
        [
          'SolarPanel_Left_1B',
          'SolarPanel_Left_S',
          'SolarPanel_Left_2B',
        ].includes(object.name)
      ) {
        object.visible = ['solar-half', 'solar-full'].includes(
          complectation.solar
        );
      }

      if (
        ['Tube_Full_1B', 'Tube_Full_S', 'Tube_Full_2B'].includes(object.name)
      ) {
        object.visible =
          complectation.solar === 'solar-full' &&
          complectation.cables !== 'no-cables';
      }

      if (
        ['Tube_Half_1B', 'Tube_Half_S', 'Tube_Half_2B'].includes(object.name)
      ) {
        object.visible =
          complectation.solar === 'solar-half' &&
          complectation.cables !== 'no-cables';
      }

      if (
        [
          'ElectricalPanel_Conduit_1B',
          'ElectricalPanel_Conduit_S',
          'ElectricalPanel_Conduit_2B',
          'ElectricalPanel_Conduit_2BA',
        ].includes(object.name)
      ) {
        object.visible = complectation.solar !== 'no-solar';
      }

      if (object.material && object.material.aoMap) {
        object.material.aoMap.channel = 1;
      }
    });

    if (
      complectation.changedValue === 'front' &&
      complectation.right === 'window' &&
      complectation.front === 'window'
    ) {
      this.options.setOption({ right: 'double doors' });
    }

    if (
      complectation.changedValue === 'right' &&
      complectation.right === 'window' &&
      complectation.front === 'window'
    ) {
      this.options.setOption({ front: 'double doors' });
    }

    this.update(1);
  }
}

window.exported = { CreateScene, CameraGsap };

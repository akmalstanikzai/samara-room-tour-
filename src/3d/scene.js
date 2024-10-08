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
import { Labels } from './labels';
import { PostProcessing } from './post-processing';
import { Panorama } from './panorama';
import { CursorPin } from './cursor';
import { Sprites } from './sprites';

/** Main class for 3d scene */
export class CreateScene {
  constructor(settings) {
    if (settings) {
      safeMerge(params, settings);
    }
    this.mouseDownPosition = null;
    this.mouseMoveThreshold = 5; // pixels
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
      // this.assets.loadAndSetupRest();

      this.renderer.compile(this.scene, this.camera);

      this.CameraGsap = new CameraGsap();
      this.postprocessing = new PostProcessing(this);
      this.postprocessing.init();

      this.initListeners();
      this.setupPerspectiveView();
      this.onResize();
      this.addSubs();
      this.startRendering();
      this.tests = new Tests(this);

      this.panorama = new Panorama(this);
      this.sprites = new Sprites(this);
      this.cursor = new CursorPin(this);

      // this.labels = new Labels(this);
      // this.labels.addLabels();

      // this.tests.testContextLoss(5);
      // this.tests.testDestroy(5);
      // this.tests.testRandomComplectation(500);
      // this.tests.testLayoutChange(50);
      this.CameraGsap.setCam('360_Entry_01', true);
      this.scene.traverse((object) => {
        if (object.name.includes('Sprite')) {
          object.visible = true;
        }
      });

      this.labels &&
        this.labels.labels.forEach((label) => {
          label.visible = true;
        });

      await delayMs(1);
      appState.loading.next({ isLoading: false });
    }
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

  async onComplectationChange() {}
}

window.exported = { CreateScene, CameraGsap };

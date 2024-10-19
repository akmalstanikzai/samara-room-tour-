import {
  HalfFloatType,
  Color,
  Vector2,
  Uniform,
  WebGLRenderTarget,
  DepthTexture,
  NearestFilter,
  RGBAFormat,
  UnsignedShortType,
  DepthFormat,
} from 'three';
import { params } from './settings';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  Effect,
  BlendFunction,
} from 'postprocessing';

// Custom effect to mask hotspots
class HotspotMaskEffect extends Effect {
  constructor(scene, camera) {
    super(
      'HotspotMaskEffect',
      `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform int debugMode;

      float readDepth(sampler2D depthSampler, vec2 coord) {
        float fragCoordZ = texture2D(depthSampler, coord).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 sceneColor = texture2D(tDiffuse, uv);
        float sceneDepth = readDepth(tDepth, uv);
        
        bool isHotspot = inputColor.r > 0.5 && inputColor.g < 0.5 && inputColor.b < 0.5;
        bool isTable = inputColor.g > 0.5 && inputColor.r < 0.5 && inputColor.b < 0.5;
        
        if (debugMode == 1) {
          // Debug mode 1: Show depth
          outputColor = vec4(vec3(sceneDepth), 1.0);
        } else if (debugMode == 2) {
          // Debug mode 2: Show hotspot and table areas
          if (isHotspot) {
            outputColor = vec4(1.0, 0.0, 0.0, 1.0); // Red for hotspots
          } else if (isTable) {
            outputColor = vec4(0.0, 1.0, 0.0, 1.0); // Green for tables
          } else {
            outputColor = sceneColor;
          }
        } else {
          // Normal mode
          if (isHotspot || isTable) {
            float elementDepth = inputColor.a;
            if (elementDepth <= sceneDepth) {
              // Element is in front of the scene
              outputColor = isHotspot ? vec4(1.0, 0.0, 0.0, 0.5) : vec4(0.0, 1.0, 0.0, 0.5);
            } else {
              // Element is behind the scene
              outputColor = sceneColor;
            }
          } else {
            // Not a hotspot or table pixel, use scene color
            outputColor = sceneColor;
          }
        }
      }
    `,
      {
        uniforms: new Map([
          ['tDiffuse', new Uniform(null)],
          ['tDepth', new Uniform(null)],
          ['cameraNear', new Uniform(0.1)],
          ['cameraFar', new Uniform(1000)],
          ['debugMode', new Uniform(0)],
        ]),
        blendFunction: BlendFunction.NORMAL,
      }
    );

    this.scene = scene;
    this.camera = camera;
    this.debugMode = 0;
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('cameraNear').value = this.camera.near;
    this.uniforms.get('cameraFar').value = this.camera.far;
    this.uniforms.get('tDiffuse').value = inputBuffer.texture;
    this.uniforms.get('debugMode').value = this.debugMode;
  }

  setDebugMode(mode) {
    this.debugMode = mode;
  }
}

class PostProcessing {
  constructor(engine) {
    this.engine = engine;
  }

  init() {
    const size = this.engine.renderer.getSize(new Vector2());

    // Create render targets
    this.sceneRenderTarget = new WebGLRenderTarget(size.width, size.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });

    this.tableRenderTarget = new WebGLRenderTarget(size.width, size.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });

    this.hotspotRenderTarget = new WebGLRenderTarget(size.width, size.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });

    // Add depth texture to sceneRenderTarget
    this.sceneRenderTarget.depthTexture = new DepthTexture();
    this.sceneRenderTarget.depthTexture.type = UnsignedShortType;

    // Create effect composer
    this.composer = new EffectComposer(this.engine.renderer, {
      frameBufferType: HalfFloatType,
      multisampling: params.postProcessing.antialias.multisampling,
    });

    // Create render pass
    this.renderPass = new RenderPass(this.engine.scene, this.engine.camera);

    // Create custom effect for combining layers
    this.combineEffect = new Effect(
      'CombineEffect',
      `
      uniform sampler2D tScene;
      uniform sampler2D tTables;
      uniform sampler2D tHotspots;
      uniform sampler2D tDepth;
      uniform int debugMode;
      uniform float cameraNear;
      uniform float cameraFar;

      float readDepth(sampler2D depthSampler, vec2 coord) {
        float fragCoordZ = texture2D(depthSampler, coord).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 sceneColor = texture2D(tScene, uv);
        vec4 tableColor = texture2D(tTables, uv);
        vec4 hotspotColor = texture2D(tHotspots, uv);
        float depth = readDepth(tDepth, uv);

        if (debugMode == 1) {
          // Debug mode 1: Show depth
          outputColor = vec4(vec3(depth), 1.0);
        } else if (debugMode == 2) {
          // Debug mode 2: Show hotspot and table areas
          if (hotspotColor.a > 0.0) {
            outputColor = vec4(1.0, 0.0, 0.0, 1.0); // Red for hotspots
          } else if (tableColor.a > 0.0) {
            outputColor = vec4(0.0, 1.0, 0.0, 1.0); // Green for tables
          } else {
            outputColor = sceneColor;
          }
        } else {
          // Normal mode
          if (tableColor.a > 0.0) {
            // If there is a table, it should mask the hotspots
            outputColor = mix(sceneColor, tableColor, 0.0); // Make tables invisible
          } else if (hotspotColor.a > 0.0) {
            float hotspotDepth = hotspotColor.a;
            if (hotspotDepth <= depth) {
              outputColor = mix(sceneColor, hotspotColor, 0.5);
            } else {
              outputColor = sceneColor;
            }
          } else {
            outputColor = sceneColor;
          }
        }
      }
    `,
      {
        uniforms: new Map([
          ['tScene', new Uniform(null)],
          ['tTables', new Uniform(null)],
          ['tHotspots', new Uniform(null)],
          ['tDepth', new Uniform(null)],
          ['debugMode', new Uniform(0)],
          ['cameraNear', new Uniform(0.1)],
          ['cameraFar', new Uniform(1000)],
        ]),
        blendFunction: BlendFunction.NORMAL,
      }
    );

    // Create effect pass
    this.effectPass = new EffectPass(this.engine.camera, this.combineEffect);

    // Add passes to composer
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.effectPass);

    // Set up resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    const size = this.engine.renderer.getSize(new Vector2());
    this.sceneRenderTarget.setSize(size.width, size.height);
    this.tableRenderTarget.setSize(size.width, size.height);
    this.hotspotRenderTarget.setSize(size.width, size.height);
    this.composer.setSize(size.width, size.height);
  }

  render() {
    // Render scene including hotspots for depth
    this.renderScene(this.sceneRenderTarget);

    // Render only tables
    this.renderTables(this.tableRenderTarget);

    // Render only hotspots
    this.renderHotspots(this.hotspotRenderTarget);

    // Combine all layers
    this.combineEffect.uniforms.get('tScene').value =
      this.sceneRenderTarget.texture;
    this.combineEffect.uniforms.get('tTables').value =
      this.tableRenderTarget.texture;
    this.combineEffect.uniforms.get('tHotspots').value =
      this.hotspotRenderTarget.texture;
    this.combineEffect.uniforms.get('tDepth').value =
      this.sceneRenderTarget.depthTexture;
    this.combineEffect.uniforms.get('cameraNear').value =
      this.engine.camera.near;
    this.combineEffect.uniforms.get('cameraFar').value = this.engine.camera.far;

    // Render final scene with effects
    this.composer.render();
  }

  renderScene(target) {
    this.engine.renderer.setRenderTarget(target);
    this.engine.renderer.clear();

    this.engine.scene.traverse((object) => {
      if (object.isMesh) {
        // Render all objects including hotspots for depth
        object.visible = object.material.name !== 'Tables'; // Exclude tables
      }
    });

    this.engine.renderer.render(this.engine.scene, this.engine.camera);
  }

  renderTables(target) {
    this.engine.renderer.setRenderTarget(target);
    this.engine.renderer.clear();

    this.engine.scene.traverse((object) => {
      if (object.isMesh) {
        object.visible = object.material.name === 'Tables';
      }
    });

    this.engine.renderer.render(this.engine.scene, this.engine.camera);
  }

  renderHotspots(target) {
    this.engine.renderer.setRenderTarget(target);
    this.engine.renderer.clear();

    this.engine.scene.traverse((object) => {
      if (object.isMesh) {
        object.visible = object.material.name === 'Hotspot';
      }
    });

    this.engine.renderer.render(this.engine.scene, this.engine.camera);
  }

  setDebugMode(mode) {
    this.combineEffect.uniforms.get('debugMode').value = mode;
  }
}

export { PostProcessing };

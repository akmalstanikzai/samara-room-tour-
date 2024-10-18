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
    this.depthRenderTarget = new WebGLRenderTarget(size.width, size.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.depthRenderTarget.depthTexture = new DepthTexture(
      size.width,
      size.height
    );
    this.depthRenderTarget.depthTexture.format = DepthFormat;
    this.depthRenderTarget.depthTexture.type = UnsignedShortType;

    this.composer = new EffectComposer(this.engine.renderer, {
      frameBufferType: HalfFloatType,
      multisampling: params.postProcessing.antialias.multisampling,
    });

    // Render pass
    this.renderPass = new RenderPass(this.engine.scene, this.engine.camera);

    // Hotspot mask effect
    this.hotspotMaskEffect = new HotspotMaskEffect(
      this.engine.scene,
      this.engine.camera
    );
    this.hotspotMaskEffect.uniforms.get('tDepth').value =
      this.depthRenderTarget.depthTexture;

    // Effect pass
    this.effectPass = new EffectPass(
      this.engine.camera,
      this.hotspotMaskEffect
    );

    // All passes
    this.allPasses = [this.renderPass, this.effectPass];

    this.allPasses.forEach((pass) => {
      this.composer.addPass(pass);
    });

    // Set up resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    const size = this.engine.renderer.getSize(new Vector2());
    this.depthRenderTarget.setSize(size.width, size.height);
    this.composer.setSize(size.width, size.height);
  }

  render() {
    // Clear depth buffer before rendering
    this.engine.renderer.setRenderTarget(this.depthRenderTarget);
    this.engine.renderer.clear(true, true, true);

    // Render depth
    this.engine.renderer.setRenderTarget(this.depthRenderTarget);
    this.engine.renderer.render(this.engine.scene, this.engine.camera);

    // Clear main render target
    this.engine.renderer.setRenderTarget(null);
    this.engine.renderer.clear(true, true, true);

    // Render scene with effects
    this.composer.render();
  }

  setDebugMode(mode) {
    if (this.hotspotMaskEffect) {
      this.hotspotMaskEffect.setDebugMode(mode);
    }
  }
}

export { PostProcessing };

import { Pass } from 'postprocessing';
import {
  FramebufferTexture,
  RGBAFormat,
  ShaderMaterial,
  WebGLRenderTarget,
  FloatType,
  NearestFilter,
  Vector2,
} from 'three';
import vertexShader from '../../shaders/basic.vert';
import { jitter } from './TAAUtils';
import taa from '../../shaders/taa.frag';

export class TAAPass extends Pass {
  constructor(camera) {
    super('TAAPass');

    this.accumulatedTexture = null;

    this.frame = 0;
    this.needsUpdate = false;
    this.renderToScreen = true;

    this.renderTarget = new WebGLRenderTarget(1, 1, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false,
    });

    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader: taa,
      vertexShader,
      uniforms: {
        inputTexture: { value: null },
        accumulatedTexture: { value: null },
        notMovedFrames: { value: 0 },
        invTexSize: { value: new Vector2(1, 1) },
        gamma: { value: 1.2 },
      },
      toneMapped: false,
      depthWrite: false,
      depthTest: false,
    });

    this._camera = camera;
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);

    this.framebufferTexture && this.framebufferTexture.dispose();
    this.framebufferTexture = new FramebufferTexture(width, height, RGBAFormat);
    this.framebufferTexture.needsUpdate = true;

    this.fullscreenMaterial.uniforms.accumulatedTexture.value =
      this.framebufferTexture;

    this.needsUpdate = true;
  }

  render(renderer, inputBuffer) {
    this.frame = (this.frame + 1) % 4096;

    this.fullscreenMaterial.uniforms.inputTexture.value = inputBuffer.texture;
    this.fullscreenMaterial.uniforms.invTexSize.value.set(
      1 / inputBuffer.width,
      1 / inputBuffer.height
    );

    const notMovedFrames =
      this.fullscreenMaterial.uniforms.notMovedFrames.value;
    if (notMovedFrames > 0) {
      const { width, height } = this.framebufferTexture.image;
      jitter(width, height, this._camera, this.frame, 1);
    }

    this.fullscreenMaterial.uniforms.notMovedFrames.value =
      this.needsUpdate || this.webGLErrorDetected
        ? 0
        : (notMovedFrames + 1) % 4096;

    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);

    // renderer.setRenderTarget(this.renderTarget);

    renderer.copyFramebufferToTexture(
      this.renderTarget,
      this.framebufferTexture
    );

    // glCopyTexSubImage2D: incompatible color component sizes && glCopyTexSubImage2D: incompatible format hotfix
    const gl = renderer.getContext();
    const error = gl.getError();

    if (error !== gl.NO_ERROR && error === 1282 && !this.webGLErrorDetected) {
      console.error('WebGL Error Detected:', error);
      this.webGLErrorDetected = true;
    }

    this.needsUpdate = false;
  }
}

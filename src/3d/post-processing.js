import { HalfFloatType } from 'three';
import { params } from './settings';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  TiltShiftEffect,
} from 'postprocessing';
import { MotionBlurEffect, VelocityDepthNormalPass } from 'realism-effects';

class PostProcessing {
  constructor(engine) {
    this.engine = engine;
  }

  init() {
    this.composer = new EffectComposer(this.engine.renderer, {
      frameBufferType: HalfFloatType,
      multisampling: params.postProcessing.antialias.multisampling,
    });

    // Render pass
    this.renderPass = new RenderPass(this.engine.scene, this.engine.camera);

    // Velocity pass (required for motion blur)
    this.velocityPass = new VelocityDepthNormalPass(
      this.engine.scene,
      this.engine.camera
    );

    // Motion blur
    this.motionBlur = new MotionBlurEffect(this.velocityPass);
    this.motionBlur.intensity = params.animation.blur.intensity;
    this.motionBlur.jitter = 0.1;
    // this.motionBlur.samples = 4;

    // Tilt Shift
    this.tiltShiftEffect = new TiltShiftEffect({
      focusArea: 0.4,
      feather: 0.3,
      offset: 0.05,
    });

    // Effect pass combining motion blur and tilt shift
    this.effectPass = new EffectPass(
      this.engine.camera,
      this.motionBlur
      // this.tiltShiftEffect
    );

    // All passes
    this.allPasses = [this.renderPass, this.velocityPass, this.effectPass];

    this.allPasses.forEach((pass) => {
      this.composer.addPass(pass);
    });
  }
}

export { PostProcessing };

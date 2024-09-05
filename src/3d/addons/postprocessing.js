import { HalfFloatType } from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  GammaCorrectionEffect,
  Colors,
  AdaptiveLuminancePass,
} from 'postprocessing';

class PostProcessing {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  setup() {
    this.composer = new EffectComposer(this.engine.renderer, {
      frameBufferType: HalfFloatType,
      multisampling: 4,
    });

    // Render pass
    this.renderPass = new RenderPass(this.engine.scene, this.engine.camera);

    this.bloomPass = new EffectPass(this.engine.camera, new BloomEffect());
    // All
    this.allPasses = [this.renderPass, this.bloomPass];

    this.allPasses.forEach((pass) => {
      this.composer.addPass(pass);
    });
  }
}

export { PostProcessing };

import MeshReflectorMaterial from '../libs/MeshReflectorMaterial';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export class Mirrors {
  constructor(engine) {
    this.engine = engine;
    this.setup();
  }

  setup() {
    this.engine.scene.traverse((object) => {
      if (object.material) {
        if (object.material.name.includes('Mirror')) {
          console.log(object);
          object.material = new MeshReflectorMaterial(
            this.engine.renderer,
            this.engine.camera,
            this.engine.scene,
            object,
            {
              resolution: 1024,
              //   blur: [512, 128],
              //   mixBlur: 2.5,
              //   mixContrast: 1.5,
              mirror: 1,
            }
          );
        }
      }
    });
  }

  update() {
    this.engine.scene.traverse((object) => {
      if (object.material) {
        if (object.material.name.includes('Mirror')) {
          object.material.update();
        }
      }
    });
  }

  //   setup() {
  //     this.engine.scene.traverse((object) => {
  //       if (object.material && object.material.name.includes('Mirror')) {
  //         const geometry = object.geometry;
  //         console.log(object);
  //         const reflector = new Reflector(geometry, {
  //           clipBias: 0.003,
  //           textureWidth: window.innerWidth * window.devicePixelRatio,
  //           textureHeight: window.innerHeight * window.devicePixelRatio,
  //           color: 0x777777,
  //         });
  //         reflector.position.copy(object.position);
  //         reflector.rotation.copy(object.rotation);
  //         reflector.scale.copy(object.scale);
  //         this.engine.scene.add(reflector);
  //         this.engine.scene.remove(object);
  //       }
  //     });
  //   }
}

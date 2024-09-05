import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { loadingManager } from './loading-manager';

const loader = new GLTFLoader(loadingManager);

const dracoLoader = new DRACOLoader();
loader.setDRACOLoader(dracoLoader);

function loadGltf(file, decoders_path) {
  dracoLoader.setDecoderPath(`${decoders_path}draco/`);
  return new Promise((resolve, reject) => {
    loader.load(file, (scene) => {
      resolve(scene);
    });
  });
}

export { loadGltf };

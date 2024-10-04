import {
  Mesh,
  Vector3,
  Group,
  Box3,
  PlaneGeometry,
  Object3D,
  ShaderMaterial,
  Color,
  Vector2,
  LinearSRGBColorSpace,
} from 'three';
import { loadGltf } from './model-loader';
import { params } from './settings';
import { appState } from '../services/app-state';
import { Materials } from './materials';
import { Textures } from './textures';
import { delayMs } from '../utils/delay';

export class Model extends Group {
  constructor(engine) {
    super();
    this.textures = new Textures();
    this.materials = new Materials();
    this.engine = engine;
  }

  async load(reInit) {
    const loadModels = async (assetsArray) => {
      return Promise.all(
        assetsArray.map(async (asset) => {
          if (
            (asset.name === this.engine.assets.initialAsset && !reInit) ||
            (reInit && asset.name !== this.engine.assets.initialAsset)
          ) {
            const promise = loadGltf(
              `${params.paths.models_path}samara/${asset.path}`,
              params.paths.decoders_path
            );
            asset.modelPromise = promise;
            return {
              file: await promise,
              name: asset.name,
            };
          }
        })
      );
    };

    const assets = await loadModels(params.models.samara.assetsArray);

    if (!reInit) {
      assets
        .filter((asset) => asset !== undefined)
        .forEach((item) => {
          this[`${item.name}_assets`] = [item.file];
        });
    }
  }

  setup(firstInit) {
    if (firstInit) {
      this.group = new Group();
      this.group.name = 'Scene children';
      this.add(this.group);
      this.engine.scene.add(this);
      this.name = 'Scene parent';
      this.engine.meshes = [];
    }

    if (firstInit) {
      this.group.scale.set(
        params.models.samara.scale.x,
        params.models.samara.scale.y,
        params.models.samara.scale.z
      );
      this.group.rotation.y = params.models.samara.rotation;
    }

    let assets = this.getAssets();
    if (!firstInit) {
      const restAssets = params.models.samara.assetsArray.filter(
        (asset) => asset.name !== this.engine.assets.initialAsset
      );
      assets = restAssets.flatMap((asset) => this.getAssets(asset.name));
    }

    assets.forEach((asset) => {
      console.log(asset);
      if (asset && asset.scene)
        asset.scene.children[0].children.forEach((object) => {
          console.log(object);
          this.group.add(object);
        });
    });
  }

  getAssets(name = appState.complectation.value.layout) {
    return this[`${name}_assets`];
  }

  computeBoundingBox(obj) {
    return new Box3().setFromObject(obj);
  }

  centerModels(model, adjustX, adjustY, adjustZ) {
    const tempBox = new Box3();
    const box = tempBox.setFromObject(model);
    const center = box.getCenter(new Vector3());
    // model.position.x += this.engine.scene.position.x - center.x + adjustX;
    model.position.y += this.engine.scene.position.y - center.y + adjustY;
    // model.position.z += this.engine.scene.position.z - center.z + adjustZ;
  }
}

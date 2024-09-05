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
      this.setupEnv();
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
      if (asset)
        asset.scene.traverse((object) => {
          if (
            object instanceof Object3D &&
            ['1Bedroom', '2Bedroom', 'Studio', '2BedroomA'].includes(
              object.name
            )
          ) {
            const nameMap = {
              '1Bedroom': 'onebed',
              Studio: 'studio',
              '2Bedroom': 'twobed',
              '2BedroomA': 'XL 8',
            };

            if (nameMap[object.name]) {
              object.name = nameMap[object.name];
              object.traverse((child) => {
                if (child instanceof Mesh) {
                  if (child.material) {
                    child.material = child.material.clone();
                    child.material.name = `${child.material.name}_${object.name}`;
                  }
                  this.materials.setupMaterials(child, object.name);
                }

                this.materials.setupFurniture(child, object.name);
              });

              object.box = this.computeBoundingBox(object);
              this.setupShadow(object);
              this.group.add(object);
              if (firstInit) {
                this.group.box = this.computeBoundingBox(this.group);
                this.centerModels(this, 0, 0.05, 0);
              }
              object.visible = false;
            }
          }
        });
    });
  }

  getAssets(name = appState.complectation.value.layout) {
    return this[`${name}_assets`];
  }

  setupShadow(model) {
    const shadowSizes = {
      onebed: { width: 1.75, height: 1.75 },
      studio: { width: 1.4, height: 1.4 },
      twobed: { width: 1.922, height: 1.922 },
      'XL 8': { width: 1.75, height: 1.75 },
    };

    const { width, height } = shadowSizes[model.name];
    const shadowMeshGeometry = new PlaneGeometry(width, height);

    const shadowMesh = new Mesh(
      shadowMeshGeometry,
      this.materials.shadowMaterial.clone()
    );
    shadowMesh.box = this.computeBoundingBox(shadowMesh);
    shadowMesh.name = `${model.name}_shadow`;
    shadowMesh.visible = false;
    shadowMesh.rotation.set(-Math.PI * 0.5, params.models.samara.rotation, 0);
    shadowMesh.scale.set(3, 3, 3);
    this.add(shadowMesh);
    shadowMesh.position.y = -0.51885;
    if (model.name === 'twobed') {
      shadowMesh.position.x -= 0.16;
    }
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

  async setupEnv() {
    const loadedModels = await Promise.all(
      params.environment.model.assetsArray.map((file) =>
        loadGltf(
          `${params.paths.models_path}${file}`,
          params.paths.decoders_path
        )
      )
    );

    const group = new Group();

    loadedModels.forEach((scene) => {
      group.add(scene.scene);
    });
    const texture = this.textures.getTexture('field');
    texture.colorSpace = LinearSRGBColorSpace;

    const material = new ShaderMaterial({
      uniforms: {
        t1: {
          value: texture,
        },
        t2: {
          value: texture,
        },
        transition: { value: 0 },
        colorA: {
          type: 'c',
          value: new Color(0xffffff),
        },
        studio: { value: 1 },
        uvOffset: { type: 'v', value: new Vector2(0, 0) },
      },
      fragmentShader: `uniform sampler2D t1;
      uniform sampler2D t2;
      uniform float transition;
      varying vec2 vUv;
      uniform vec3 colorA;
      uniform bool studio;
      uniform vec2 uvOffset;
      
      void main() {
        vec4 tex1 = texture2D(t1, vUv + uvOffset);
        vec4 tex2 = texture2D(t2, vUv + uvOffset);
        gl_FragColor = mix(tex1, tex2, transition);
        if (studio) {
          gl_FragColor = mix(tex1, tex2, transition) * vec4(colorA, 1.0);
        }
      }
      `,
      vertexShader: `varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
    });

    group.traverse((mesh) => {
      if (mesh.name === 'Dome') {
        mesh.renderOrder = 1;
        mesh.material = material;
        // this.centerModels(mesh, 0);
        mesh.scale.setScalar(0.009);

        // this.add(mesh);
        this.skydome = mesh;
        this.skydome.position.y = -0.6;
      }
    });

    // this.engine.scene.add(this.skydome);
  }
}

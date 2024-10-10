import { SRGBColorSpace, NoToneMapping, Vector3 } from 'three';
import { MathUtils } from './libs/math';
import { appState } from '../services/app-state';
import { Power3, Linear, Power4 } from 'gsap';
import { createPanoItem, createTextureObject } from './panorama';
import panoItems from '../json/panoItems.json';

function setPixelRatio() {
  return Math.max(1, window.devicePixelRatio);
}

const params = {
  postProcessing: {
    enabled: true,
    antialias: {
      multisampling: 4,
    },
  },
  animation: {
    blur: {
      intensity: 3,
    },
    move: {
      duration: 1,
      ease: Power4.easeOut,
      easeName: 'Power4.easeOut',
    },
    fadeIn: {
      ease: Linear,
      easeName: 'Linear',
      duration: 0.2,
    },
    fadeOut: {
      easeName: 'Linear',
      ease: Linear,
      duration: 0.4,
    },
    transitionDelay: {
      percentage: 0.5,
    },
  },
  container: null,
  paths: {
    models_path: '/models/',
    textures_path: '/textures/',
    decoders_path: '/decoders/',
  },
  loadOnDemand: {
    enabled: true,
    loadingManager: {
      enabled: true,
    },
  },

  useCompressedTextures: false, // Use ktx2 compressed textures
  renderer: {
    renderOnDemand: { enabled: true },
    outputEncoding: SRGBColorSpace,
    pixelRatio: setPixelRatio(),
    exposure: 1,
    toneMapping: NoToneMapping,
    defaultRenderer: {
      antialias: true,
      alpha: true,
    },
  },

  camera: {
    portraitAspect: 3.5 / 4,
    landscapeAspect: 4 / 3.5,
    near: 5,
    far: 50,
    fov: 45,
    initPos: {
      x: -10.873648212948423,
      y: 0.4188578127354573,
      z: 5.075787066382408,
    },
  },

  light: {
    intensity: 1,
  },

  envMap: {
    intensity: 1.5,
  },

  materials: {
    metal: { metalness: 0.2, roughness: 0.3 },
    wood: { metalness: 0.2, roughness: 0.7 },
  },

  maps: {
    lightMap: {
      intensity: 0.01,
    },
    aoMap: {
      intensity: 1,
    },
  },

  aoMap: {
    air: { intensity: 0.5 },
    desk: { intensity: 0.5 },
    roof: { intensity: 0.5 },
    patio: { intensity: 0.5 },
    exterior: {
      intensity: 0.4,
    },
  },

  controls: {
    thirdPerson: {
      focalOffset: {
        x: 0,
        y: 0,
        z: 0,
      },
      smoothTime: 0.3,
      draggingSmoothTime: 0.3,
      polarRotateSpeed: 1,
      azimuthRotateSpeed: 1,
      maxDistance: 4,
      minDistance: 3,
      maxPolarAngle: MathUtils.degToRad(88),
      minPolarAngle: MathUtils.degToRad(0),
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      minZoom: 2.25,
      maxZoom: 10,
      defaultZoom: 2.5,
      near: 0.5,
    },

    firstPerson: {
      focalOffset: {
        x: 0,
        y: 0,
        z: 0,
      },
      minZoom: 0.35,
      maxZoom: 0.8,
      defaultZoom: 0.5,
      near: 0.01,
      polarRotateSpeed: -1,
      azimuthRotateSpeed: -1,
      smoothTime: 0.1,
      draggingSmoothTime: 0.1,
      maxPolarAngle: MathUtils.degToRad(120),
      minPolarAngle: MathUtils.degToRad(50),
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
    },
  },
  get pano() {
    return panoItems.map(({ name, textureMap, visible }) =>
      createPanoItem(name, textureMap, visible)
    );
  },

  environment: {
    assetsArray: [
      {
        id: 1,
        hdrTexturePath: 'hdr/1.hdr',
        name: 'hdr-1',
        defaultHdrIntensity: 0.9,
      },

      {
        id: 2,
        hdrTexturePath: 'hdr/2.hdr',
        name: 'hdr-2',
        isDefault: true,
        defaultHdrIntensity: 1.5,
      },
      {
        id: 3,
        hdrTexturePath: 'hdr/spiaggia_di_mondello_1k.hdr',
        name: 'hdr-3',
        defaultHdrIntensity: 0.9,
      },
      {
        id: 4,
        hdrTexturePath: 'hdr/overcast.hdr',
        name: 'overcast',
        defaultHdrIntensity: 0.05,
      },
    ],
  },

  shadowMesh: {
    opacity: 0.8,
  },
  textures: [
    { path: 'pin.png', name: 'pin', anisotropy: true },
    { path: 'cursor.png', name: 'cursor', anisotropy: true },
    ...panoItems.map(({ textureMap }) => createTextureObject(textureMap)),
  ],

  models: {
    samara: {
      complectationVars: {
        Trim: {
          variants: [
            {
              id: MathUtils.generateUUID(),
              name: 'wood',
            },
            {
              id: MathUtils.generateUUID(),
              name: 'metal',
            },
          ],
        },
        Support: {
          variants: [
            {
              id: 1,
              name: 'Bone white base',
              hex: 0xfcfdfd,
            },
            {
              id: 2,
              name: 'Parchment base',
              hex: 0xe0ddd3,
            },
            {
              id: 5,
              name: 'Dark bronze base',
              hex: 0x423e38,
            },
          ],
        },
        Color: {
          variants: [
            {
              id: 1,
              name: 'Bone white base',
              hex: 0xfcfdfd,
            },

            {
              id: 2,
              name: 'Parchment base',
              hex: 0xe0ddd3,
            },

            {
              id: 3,
              name: 'Driftwood base',
              hex: 0xdcdfdf,
            },

            {
              id: 4,
              name: 'Evergreen base',
              hex: 0x344739,
            },

            {
              id: 5,
              name: 'Dark bronze base',
              hex: 0x423e38,
            },
          ],
        },

        Roof: {
          get camera() {
            return appState.complectation.value.layout === 'XL 8'
              ? 'roof-XL 8'
              : 'roof';
          },
          variants: [
            {
              id: 8,
              name: 'Dark Bronze Roof',
              hex: 0x2f2d2b,
            },
            {
              id: 7,
              name: 'Metallic Silver Roof',
              hex: 0xcdcdcd,
            },
          ],
        },

        Layout: {
          variants: [
            {
              camera: 'front',
              name: 'onebed',
            },
            {
              camera: 'front',
              name: 'studio',
            },
            {
              camera: 'front',
              name: 'twobed',
            },
            {
              camera: 'right',
              name: 'XL 8',
            },
          ],
        },

        Front: {
          get camera() {
            return appState.complectation.value.layout === 'XL 8'
              ? 'right'
              : 'front';
          },
          variants: [
            {
              name: 'window',
              include: { layouts: ['studio', 'onebed', 'twobed', 'XL 8'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['studio', 'onebed', 'twobed', 'XL 8'] },
            },
          ],
        },

        'Primary bedroom': {
          camera: 'front',
          variants: [
            {
              name: 'window',
              include: { layouts: ['XL 8'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['XL 8'] },
            },
          ],
        },

        Left: {
          camera: 'left',
          variants: [
            {
              name: 'window',
              include: { layouts: ['studio', 'onebed', 'twobed'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['studio', 'onebed', 'twobed'] },
            },
          ],
        },

        Right: {
          camera: 'right',
          variants: [
            {
              name: 'window',
              include: { layouts: ['studio'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['studio'] },
            },
          ],
        },

        'Living room': {
          camera: 'rear',
          variants: [
            {
              name: 'window',
              include: { layouts: ['XL 8'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['XL 8'] },
            },
          ],
        },

        'Secondary bedroom': {
          camera: 'rear',
          variants: [
            {
              name: 'window',
              include: { layouts: ['XL 8'] },
            },
            {
              name: 'double doors',
              include: { layouts: ['XL 8'] },
            },
          ],
        },

        Solar: {
          get camera() {
            return appState.complectation.value.layout === 'XL 8'
              ? 'roof-XL 8'
              : 'roof';
          },
          variants: [
            {
              name: 'no-solar',
            },
            {
              name: 'solar-full',
            },
            {
              name: 'solar-half',
            },
          ],
        },

        Cables: {
          variants: [
            {
              name: 'cables-full',
            },
            {
              name: 'no-cables',
            },
          ],
        },
      },
      modelScaleAspectValue: 150,
      assetsArray: [
        {
          name: 'studio',
          totalAssetsCount: 11,
          path: '1B_roomtour_new.glb',
          textures: [],
        },
      ],
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
      rotation: Math.PI,
    },
  },
};

export { params };

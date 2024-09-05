import { SRGBColorSpace, NoToneMapping, Vector3 } from 'three';
import { MathUtils } from './libs/math';
import { appState } from '../services/app-state';
import { Power3, Linear } from 'gsap';
import { repeat } from 'lodash';

function setPixelRatio() {
  return Math.max(1, window.devicePixelRatio);
}

const EPS = 0.000011177461712 * 0.0001;

const params = {
  postProcessing: {
    enabled: false,
    antialias: {
      multisampling: 4,
      taa: {
        enabled: true,
      },
    },
    ao: {
      get preset() {
        return params.integration ? 'preset1' : 'preset2';
      },
      presets: [
        {
          name: 'preset1',
          settings: {
            distanceFalloff: 1.8,
            intensity: 2,
          },
        },
        {
          name: 'preset2',
          settings: {
            distanceFalloff: 3.3,
            intensity: 2.85,
          },
        },
        {
          name: 'preset3',
          settings: {
            distanceFalloff: 2.95,
            intensity: 2.5,
          },
        },
      ],
      enabled: false,
      gammaCorrection: false,
      aoRadius: 1,
      halfRes: false,
      aoSamples: 15,
      denoiseSamples: 25,
      denoiseRadius: 18,
      screenSpaceRadius: false,
      depthAwareUpsampling: true,
      transparencyAware: false,
    },
    bloom: {
      enabled: true,
      mipmapBlur: true,
      levels: 9,
    },
  },
  animation: {
    blur: {
      intensity: 3,
    },
    move: {
      duration: 1,
      ease: Power3.easeOut,
      easeName: 'Power3.easeOut',
    },
    fadeIn: {
      ease: Linear,
      easeName: 'Linear',
      duration: 0.3,
    },
    fadeOut: {
      easeName: 'Linear',
      ease: Linear,
      duration: 0.4,
    },
    transitionDelay: {
      duration: 0.4,
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
    intensity: Math.PI,
  },

  envMap: {
    intensity: 1.5,
  },

  materials: {
    metal: { metalness: 0.2, roughness: 0.3 },
    wood: { metalness: 0.2, roughness: 0.7 },
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
      smoothTime: 0.07,
      draggingSmoothTime: 0.07,
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
      defaultZoom: 0.45,
      near: 0.01,
      polarRotateSpeed: 1,
      azimuthRotateSpeed: 1,
      smoothTime: 0.1,
      draggingSmoothTime: 0.1,
      maxPolarAngle: MathUtils.degToRad(120),
      minPolarAngle: MathUtils.degToRad(50),
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
    },
  },

  cameras: {
    'XL 8': {
      kitchen: {
        type: 'interior',
        position: {
          x: 0.9669533835461805,
          y: -0.000009736837024992389,
          z: -0.5131262467546206,
        },
        target: {
          x: 0.9669529648555366,
          y: -0.00001000000000000302,
          z: -0.5131121132680234,
        },
      },
      bedroom1: {
        type: 'interior',
        position: {
          x: -0.556328727338153,
          y: -0.000009407015325517725,
          z: 0.9178091255108709,
        },
        target: {
          x: -0.5563276833460133,
          y: -0.000010000000000006176,
          z: 0.9177950344339217,
        },
      },
      bedroom2: {
        type: 'interior',
        position: {
          x: -0.8984550317804412,
          y: -0.000009243685328126113,
          z: -1.0818170513110221,
        },
        target: {
          x: -0.8984546944555635,
          y: -0.000010000000000009787,
          z: -1.0818029334429096,
        },
      },
      bath: {
        type: 'interior',
        position: {
          x: -0.038367322822119736,
          y: -0.000009236437876152032,
          z: -0.7891501804054913,
        },
        target: {
          x: -0.03836662082479898,
          y: -0.000009999999999995063,
          z: -0.7891360763573971,
        },
      },
      bath2: {
        type: 'interior',
        position: {
          x: -0.21181978204511767,
          y: -0.00001007030209396587,
          z: 0.8368249863883949,
        },
        target: {
          x: -0.21180564028744323,
          y: -0.000010000000000003687,
          z: 0.8368249105761806,
        },
      },
    },
    onebed: {
      kitchen: {
        type: 'interior',
        position: {
          x: -1.2813810861908093,
          y: -0.000009532872989879228,
          z: -0.21004168206363666,
        },
        target: {
          x: -1.2813669553167915,
          y: -0.000010000000000003587,
          z: -0.21004136553267266,
        },
      },

      bath: {
        type: 'interior',
        position: {
          x: 0.5244948964486399,
          y: -0.000009730903270984426,
          z: -0.42152794278601785,
        },
        target: {
          x: 0.5244807586910627,
          y: -0.000010000000000007616,
          z: -0.42152771607554096,
        },
      },
      bedroom: {
        type: 'interior',
        position: {
          x: 1.1732523328335465,
          y: -0.000009267560686101598,
          z: 0.22768810124225858,
        },
        target: {
          x: 1.1732530886583261,
          y: -0.000010000000000012293,
          z: 0.22767399832548382,
        },
      },
    },
    twobed: {
      kitchen: {
        type: 'interior',
        position: {
          x: -1.2813810861908093,
          y: -0.000009532872989879228,
          z: -0.21004168206363666,
        },
        target: {
          x: -1.2813669553167915,
          y: -0.000010000000000003587,
          z: -0.21004136553267266,
        },
      },

      bedroom: {
        type: 'interior',
        position: {
          x: 1.6738861598574157,
          y: -0.000009430903637766457,
          z: 0.32546036622324964,
        },
        target: {
          x: 1.6738871380451383,
          y: -0.000010000000000004314,
          z: 0.325446269440705,
        },
      },
      bath: {
        type: 'interior',
        position: {
          x: 0.8054896563086622,
          y: -0.000009432325613081872,
          z: -0.357136195680734,
        },
        target: {
          x: 0.805475536254235,
          y: -0.00001000000000000633,
          z: -0.35713564630948896,
        },
      },
    },
    studio: {
      kitchen: {
        type: 'interior',
        get position() {
          return window.engine.scene
            .getObjectByName('pano1')
            .getWorldPosition(new Vector3());
        },
        get target() {
          return {
            x: this.position.x + EPS * 15,
            y: this.position.y + EPS * 0.0001,
            z: this.position.z - EPS,
          };
        },
      },

      bed: {
        type: 'interior',
        get position() {
          return window.engine.scene
            .getObjectByName('pano2')
            .getWorldPosition(new Vector3());
        },
        get target() {
          return {
            x: this.position.x + EPS * 20,
            y: this.position.y + EPS * 0.0001,
            z: this.position.z - EPS,
          };
        },
      },

      hallway: {
        type: 'interior',
        get position() {
          return window.engine.scene
            .getObjectByName('pano3')
            .getWorldPosition(new Vector3());
        },
        get target() {
          return {
            x: this.position.x + EPS * 20,
            y: this.position.y + EPS * 0.0001,
            z: this.position.z - EPS,
          };
        },
      },

      // bath: {
      //   type: 'interior',
      //   position: {
      //     x: 0.9423631053365822,
      //     y: -0.000009745346305970568,
      //     z: -0.34116502944112304,
      //   },
      //   target: {
      //     x: 0.9423489823468986,
      //     y: -0.000009999999999996513,
      //     z: -0.341164339286144,
      //   },
      // },
    },

    'floor plan': {
      position: {
        x: 0.03154852632367916,
        y: 12.007266406546096,
        z: -0.000002439029155059685,
      },
      target: { x: 0, y: 0, z: 0 },
    },
    front: {
      position: { x: 0, y: 0.4188578127354573, z: 12 },
      target: { x: 0, y: 0, z: 0 },
    },
    rear: {
      position: { x: 0, y: 0.4188578127354573, z: -12 },
      target: { x: 0, y: 0, z: 0 },
    },
    left: {
      position: { x: -11.375, y: 0.4188578127354573, z: 0 },
      target: { x: 0, y: 0, z: 0 },
    },
    right: {
      position: { x: 11.375, y: 0.4188578127354573, z: 0 },
      target: { x: 0, y: 0, z: 0 },
    },
    roof: {
      position: {
        x: 10.906420218726824,
        y: 1.3678992277499347,
        z: -4.81444178646579,
      },
      target: { x: 0, y: 0, z: 0 },
    },
    'roof-XL 8': {
      position: {
        x: -10.906420218726824,
        y: 1.3678992277499347,
        z: 4.81444178646579,
      },
      target: { x: 0, y: 0, z: 0 },
    },
  },

  environment: {
    model: {
      assetsArray: ['env_uvs.glb'],
    },
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
    { path: 'Circle_512.png', name: 'pin' },
    {
      path: 'field.png',
      name: 'field',
    },
    {
      path: 'panorama1.png',
      name: 'studio_360',
    },

    {
      path: 'panorama2.png',
      name: 'studio_360_1',
    },
    {
      path: 'panorama3.png',
      name: 'studio_360_2',
    },
    { path: 'grid_solar_panel_tiled_basecolor_dark.jpg', name: 'Solar_Panel' },
    {
      path: 'grid_solar_panel_tiled_metallic.jpg',
      name: 'Solar_Panel_metalness',
    },
    {
      path: 'Support/Deck_2K.png',
      name: 'cedar_ao_new',
    },
    {
      path: 'Support/SupportPatio_2K.png',
      name: 'patio_supp_ao',
    },

    {
      path: 'AO_AirEx.png',
      ktxPath: 'ktx/AO_AirEx.ktx2',
      name: 'ao_air_ex',
    },

    {
      path: 'Albedo_Chair_512.jpg',
      name: 'Albedo_Chair_512',
    },
    {
      path: 'Albedo_Bath_512.jpg',
      name: 'Albedo_Bath_512',
    },
    {
      path: 'Albedo_Faucet_512.jpg',
      name: 'Albedo_Faucet_512',
    },
    {
      path: 'Albedo_Oven_512.jpg',
      name: 'Albedo_Oven_512',
    },
    {
      path: 'Albedo_Shelves_512.jpg',
      name: 'Albedo_Shelves_512',
    },
    {
      path: 'Albedo_Wood_512.jpg',
      name: 'Albedo_Wood_512',
    },

    {
      path: 'Albedo_Lamp_512.jpg',
      name: 'Albedo_Lamp_512',
    },

    {
      path: 'Albedo_Sofa_512.jpg',
      name: 'Albedo_Sofa_512',
    },

    { path: 'Albedo_Bed_512.jpg', name: 'Albedo_Bed_512' },
    {
      path: 'Air_purification.jpg',
      name: 'Air_purification',
    },
    {
      path: 'Oak_Wood_Varnished_Albedo_2Kt.jpg',
      name: 'Oak_Wood_Varnished_Albedo_2Kt',
      repeat: true,
    },
    {
      path: 'glass_orm.png',
      name: 'glass_orm',
      repeat: true,
    },
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
          name: 'onebed',
          totalAssetsCount: 41,
          path: 'Samara_1Bedroom.glb',
          textures: [
            { path: 'Wall_i_1B.png', name: 'Wall_i_1B' },
            { path: 'Wood_1B.png', name: 'Wood_1B' },
            { path: 'Floor_1B.png', name: 'Floor_1B' },

            { path: '1_1B.png', name: '1_1B' },
            { path: '2_1B.png', name: '2_1B' },
            { path: '3_1B.png', name: '3_1B' },
            { path: '4_1B.png', name: '4_1B' },

            {
              path: 'Wall_e_1B_W.png',
              name: 'exterior_ao_wood_onebed',
            },
            {
              path: 'Wall_e_1B.png',
              name: 'exterior_ao_onebed',
            },

            {
              path: 'Wall_e_1B_W_2.png',
              name: 'exterior_ao_wood_onebed_nosolar',
            },

            {
              path: 'Wall_e_1B_2.png',
              name: 'exterior_ao_onebed_nosolar',
            },

            {
              path: 'Wall_e_1B_W_1.png',
              name: 'exterior_ao_wood_onebed_solar_no_cables',
            },

            {
              path: 'Wall_e_1B_1.png',
              name: 'exterior_ao_onebed_solar_no_cables',
            },

            {
              path: 'AO_RoofSolarFull.png',
              name: 'roof_solar_full_ao_onebed',
            },
            {
              path: 'AO_RoofSolarFull - no cables.png',
              name: 'roof_solar_full_ao_onebed_no_cables',
            },

            {
              path: 'AO_RoofSolarOne.png',
              name: 'roof_solar_half_ao_onebed',
            },
            {
              path: 'AO_RoofSolarOne - no cables.png',
              name: 'roof_solar_half_ao_onebed_no_cables',
            },
            {
              path: 'AO_1BedRoof_SolarClean_1K.png',
              name: 'roof_solar_none_ao_onebed',
            },
          ],
        },
        {
          name: 'studio',
          totalAssetsCount: 60,
          path: 'Studio.glb',
          textures: [
            { path: 'Studio_Wall_BaseColor.png', name: 'Wall_i_S' },
            { path: '1_S.png', name: '1_S' },
            { path: '2_S.png', name: '2_S' },
            { path: '3_S.png', name: '3_S' },
            { path: '4_S.png', name: '4_S' },
            { path: '5_S.png', name: '5_S' },
            { path: '6_S.png', name: '6_S' },

            {
              path: 'Wall_e_S_W.png',
              name: 'exterior_ao_wood_studio',
            },
            {
              path: 'Wall_e_S.png',
              name: 'exterior_ao_studio',
            },

            {
              path: 'Wall_e_S_W_1.png',
              name: 'exterior_ao_wood_studio_no_cables',
            },

            {
              path: 'Wall_e_S_1.png',
              name: 'exterior_ao_studio_no_cables',
            },

            {
              path: 'Wall_e_S_W_2.png',
              name: 'exterior_ao_wood_studio_nosolar',
            },
            {
              path: 'Wall_e_S_2.png',
              name: 'exterior_ao_studio_nosolar',
            },

            {
              path: 'Wall_e_S_W_D.png',
              name: 'studio_exterior_ao_wood_stairs_solar',
            },
            {
              path: 'Wall_e_S_D.png',
              name: 'studio_exterior_ao_stairs_solar',
            },

            {
              path: 'Wall_e_S_W_1D.png',
              name: 'studio_exterior_ao_wood_stairs_solar_no_cables',
            },

            {
              path: 'Wall_e_S_1D.png',
              name: 'studio_exterior_ao_stairs_solar_no_cables',
            },

            {
              path: 'Wall_e_S_W_2D.png',
              name: 'studio_exterior_ao_wood_stairs_no_solar',
            },

            {
              path: 'Wall_e_S_2D.png',
              name: 'studio_exterior_ao_stairs_no_solar',
            },
            {
              path: 'S_AO_RoofSolarFull.png',
              name: 'roof_solar_full_ao_studio',
            },
            {
              path: 'AO_RoofSolarFull - no cables.png',
              name: 'roof_solar_full_ao_studio_no_cables',
            },
            {
              path: 'S_AO_RoofSolarFull - no cables.png',
              name: 'roof_solar_full_ao_studio_no_cables',
            },
            {
              path: 'S_AO_RoofSolarOne.png',
              name: 'roof_solar_half_ao_studio',
            },
            {
              path: 'S_AO_RoofSolarOne - no cables.png',
              name: 'roof_solar_half_ao_studio_no_cables',
            },
            {
              path: 'AO_RoofSolarClean_S_1K.png',
              name: 'roof_solar_none_ao_studio',
            },

            {
              path: 'Studio_Chair1_BaseColor.png',
              name: 'Studio_Chair1_BaseColor',
            },

            {
              path: 'Studio_Chair1_Lightmap.png',
              name: 'Studio_Chair1_Lightmap',
            },

            {
              path: 'Studio_Chair_BaseColor.png',
              name: 'Studio_Chair_BaseColor',
            },

            {
              path: 'Studio_Chair_Lightmap.png',
              name: 'Studio_Chair_Lightmap',
            },

            {
              path: 'floor.jpg',
              name: 'Studio_Floor_BaseColor',
              repeat: true,
              repeatSet: 8,
            },

            {
              path: 'Studio_Floor_Lightmap.png',
              name: 'Studio_Floor_Lightmap',
            },
            {
              path: 'Studio_Wood_BaseColor.png',
              name: 'Studio_Wood_BaseColor',
            },

            {
              path: 'Studio_Wood_Lightmap.png',
              name: 'Studio_Wood_Lightmap',
            },
            {
              path: 'Studio_Wall_Lightmap.png',
              name: 'Studio_Wall_Lightmap',
            },
            {
              path: 'Studio_Shelves_Lightmap.png',
              name: 'Studio_Shelves_Lightmap',
            },
            {
              path: 'Studio_Shelves_BaseColor.png',
              name: 'Studio_Shelves_BaseColor',
            },
            {
              path: 'Studio_Oven_Basecolor.png',
              name: 'Studio_Oven_BaseColor',
            },
            {
              path: 'Studio_Oven_Lightmap.png',
              name: 'Studio_Oven_Lightmap',
            },
            { path: 'Studio_Bed_Basecolor.png', name: 'Studio_Bed_Basecolor' },
            { path: 'Studio_Bed_Lightmap.png', name: 'Studio_Bed_Lightmap' },
          ],
        },
        {
          name: 'twobed',
          totalAssetsCount: 41,
          path: 'Samara_2Bedroom.glb',
          textures: [
            { path: 'Wall_i_2B.png', name: 'Wall_i_2B' },
            { path: '1_2B.png', name: '1_2B' },
            { path: '2_2B.png', name: '2_2B' },
            { path: '3_2B.png', name: '3_2B' },
            { path: '4_2B.png', name: '4_2B' },
            {
              path: 'Wall_e_2B_W_1.png',
              name: 'exterior_ao_wood_twobed_solar_no_cables',
            },
            {
              path: 'Wall_e_2B_1.png',
              name: 'exterior_ao_twobed_solar_no_cables',
            },

            {
              path: 'Wall_e_2B_W.png',
              name: 'exterior_ao_wood_twobed',
            },
            {
              path: 'Wall_e_2B.png',
              name: 'exterior_ao_twobed',
            },

            {
              path: 'Wall_e_2B_W_2.png',
              name: 'exterior_ao_wood_twobed_nosolar',
            },

            {
              path: 'Wall_e_2B_2.png',
              name: 'exterior_ao_twobed_nosolar',
            },
            {
              path: 'Roof_2B_Clean_1Kt.png',
              name: 'roof_solar_none_ao_twobed',
            },
            {
              path: 'Roof_2B_Full_1Kt.png',
              name: 'roof_solar_full_ao_twobed',
            },
            {
              path: 'Roof_2B_Full_1Kt - no cables.png',
              name: 'roof_solar_full_ao_twobed_no_cables',
            },
            {
              path: 'Roof_2B_One_1Kt.png',
              name: 'roof_solar_half_ao_twobed',
            },
            {
              path: 'Roof_2B_One_1Kt - no cables.png',
              name: 'roof_solar_half_ao_twobed_no_cables',
            },

            {
              path: 'Floor_2B.png',
              name: 'Floor_2B',
            },
            {
              path: 'Wood_2B.png',
              name: 'Wood_2B',
            },
          ],
        },
        {
          name: 'XL 8',
          totalAssetsCount: 45,
          path: 'Samara_XL8.glb',
          textures: [
            { path: '1_2BA.png', name: '1_2BA' },
            { path: '2_2BA.png', name: '2_2BA' },
            { path: '3_2BA.png', name: '3_2BA' },
            { path: '4_2BA.png', name: '4_2BA' },
            { path: '5_2BA.png', name: '5_2BA' },
            { path: '6_2BA.png', name: '6_2BA' },
            { path: '7_2BA.png', name: '7_2BA' },
            { path: '8_2BA.png', name: '8_2BA' },

            { path: 'AO_XL8_M_1.png', name: 'AO_2BA_M_1' },
            { path: 'AO_XL8_M.png', name: 'AO_2BA_M' },
            { path: 'AO_XL8_W_1.png', name: 'AO_2BA_W_1' },
            { path: 'AO_XL8_W.png', name: 'AO_2BA_W' },
            { path: 'Roof_XL8_Clear.png', name: 'Roof_2BA_Clear' },
            { path: 'Roof_XL8_Full.png', name: 'Roof_2BA_Full' },
            { path: 'Roof_XL8_One.png', name: 'Roof_2BA_One' },
            { path: 'Shelves_XL8.png', name: 'Shelves_XL8' },
            { path: 'Base_2BA.png', name: 'Base_2BA' },
            { path: 'Chair_XL8.png', name: 'Chair_2BA' },
            { path: 'Floor_XL8.png', name: 'Floor_2BA' },
            { path: 'Sofa_2BA_1K.png', name: 'Sofa_2BA' },
            { path: 'Wall_XL8.png', name: 'Wall_2BA_1K' },
            { path: 'Wood_XL8.png', name: 'Wood_2BA' },
            { path: 'Technique_XL8.png', name: 'Technique_2BA' },
          ],
        },
      ],
      scale: {
        x: 0.3,
        y: 0.3,
        z: 0.3,
      },
      rotation: Math.PI,
    },
  },
};

export { params };

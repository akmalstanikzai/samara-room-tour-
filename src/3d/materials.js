import {
  MeshPhysicalMaterial,
  Color,
  Vector2,
  MeshLambertMaterial,
  Object3D,
  Mesh,
  DoubleSide,
} from 'three';
import { params } from './settings';
import { Textures } from './textures';
import { MeshTransmissionMaterial } from './libs/MeshTransmissionMaterial';
import MeshReflectorMaterial from './libs/MeshReflectorMaterial';

export class Materials {
  constructor() {
    this.textures = new Textures();
    this.allMaterials = new Map();
    this.transmissiveMaterials = new Set();
  }

  applyTextures(object, map, normalMap) {
    if (object instanceof Object3D) {
      object.traverse((mesh) => {
        if (mesh.material) {
          map && (mesh.material.map = map);
          normalMap && (mesh.material.normalMap = normalMap);
        }
      });
    }

    if (object instanceof Mesh) {
      map && (object.material.map = map);
      normalMap && (object.material.normalMap = normalMap);
    }
  }

  setupFurniture(object) {
    // if (object.name === 'Chair1_S') {
    //   this.applyTextures(
    //     object,
    //     this.textures.getTexture('studio_chair1_basecolor')
    //   );
    // }

    if (['Chair_S', 'Chair_1B', 'Chair_2B'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Chair_512'));
    }

    if (
      ['Const_Bath_S', 'Const_Bath_1B', 'Const_Bath_2B'].includes(object.name)
    ) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Bath_512'));
    }

    if (['Faucet_S', 'Faucet_1B', 'Faucet_2B'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Faucet_512'));
    }

    if (['Oven_S', 'Oven', 'Oven_2B'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Oven_512'));
    }

    if (object.name === 'Shelves_2BA') {
      this.applyTextures(object, this.textures.getTexture('Shelves_XL8'));
    }

    if (['Bed_2B', 'Bed_1B', 'Bed_S', 'Bed_2BA'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Bed_512'));
    }

    if (['Lampe', 'Lampe_2B'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Lamp_512'));
    }

    if (['Sofa', 'Sofa_2B'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Albedo_Sofa_512'));
    }

    if (['Sofa_2BA'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Sofa_2BA'));
    }

    if (['Chair_2BA'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Chair_2BA'));
    }

    if (['Base_2BA_1'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Base_2BA'));
    }

    if (['WoodFurniture_2BA'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Wood_2BA'));
    }

    if (['Technique_2BA_1'].includes(object.name)) {
      this.applyTextures(object, this.textures.getTexture('Technique_2BA'));
    }
  }

  setupMaterials(mesh, modelName) {
    !this.glassClearMaterial &&
      (this.glassClearMaterial = new MeshPhysicalMaterial({
        transmission: 0.6,
        color: new Color(0x878787).convertLinearToSRGB(),
        depthWrite: false,
        metalnessMap: this.textures.getTexture('glass_orm'),
        roughnessMap: this.textures.getTexture('glass_orm'),
        name: 'Glass Clear',
        roughness: 0,
        side: DoubleSide,
      }));

    !this.exteriorMaterial &&
      (this.exteriorMaterial = new MeshPhysicalMaterial({
        color: new Color(
          params.models.samara.complectationVars.Color.variants[0].hex
        ),
        roughness: params.materials.metal.roughness,
        metalness: params.materials.metal.metalness,
        aoMapIntensity: params.aoMap.exterior.intensity,
      }));

    !this.exteriorWoodMaterial &&
      (this.exteriorWoodMaterial = new MeshPhysicalMaterial({
        color: new Color(
          params.models.samara.complectationVars.Color.variants[0].hex
        ),
        roughness: params.materials.wood.roughness,
        metalness: params.materials.wood.metalness,
        aoMapIntensity: params.aoMap.exterior.intensity,
      }));

    !this.roofMaterial &&
      (this.roofMaterial = new MeshPhysicalMaterial({
        color: new Color(
          params.models.samara.complectationVars.Roof.variants[0].hex
        ),
        roughness: 0.7,
        metalness: 0.2,
        aoMapIntensity: params.aoMap.roof.intensity,
      }));

    !this.shadowMaterial &&
      (this.shadowMaterial = new MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: params.shadowMesh.opacity,
        side: DoubleSide,
        depthWrite: false,
      }));

    if (mesh.name.includes('Spigot')) {
      mesh.material.color = new Color(0xc79d5d).convertLinearToSRGB();
      mesh.material.roughness = 0;
      mesh.material.metalness = 1;
    }

    if (mesh.name === 'Sanr_2BA') {
      mesh.visible = false;
    }

    if (mesh.material) {
      const name = mesh.material.name;
      const color = mesh.material.color;
      mesh.material = new MeshLambertMaterial({
        name: name,
        color: color,
      });

      if (mesh.material.name.includes('WoodCh_S')) {
        mesh.material.map = this.textures.getTexture('Studio_Chair1_BaseColor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Chair1_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture(
          'Studio_Chair1_Lightmap'
        );
        mesh.material.aoMap.channel = 1;
        // mesh.material.lightMapIntensity = 10;
      }
      if (mesh.material.name === 'Chair_studio') {
        mesh.material.map = this.textures.getTexture('Studio_Chair_BaseColor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Chair_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Chair_Lightmap');
        mesh.material.lightMap.channel = 1;
        mesh.material.aoMap.channel = 1;
      }

      if (mesh.material.name === 'Floor_S_studio') {
        mesh.material.map = this.textures.getTexture('Studio_Floor_BaseColor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Floor_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Floor_Lightmap');
        mesh.material.aoMap.channel = 1;
        mesh.material.lightMap.channel = 1;
      }

      if (mesh.material.name === 'Wood_S_studio') {
        mesh.material.map = this.textures.getTexture('Studio_Wood_BaseColor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Wood_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Wood_Lightmap');
        mesh.material.lightMap.channel = 1;
        mesh.material.aoMap.channel = 1;
      }

      if (mesh.material.name === 'Wall_studio') {
        mesh.material.map = null;
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Wall_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Wall_Lightmap');
        mesh.material.lightMap.channel = 1;
        mesh.material.aoMap.channel = 1;
      }

      if (mesh.material.name === 'Shelves_studio') {
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Shelves_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture(
          'Studio_Shelves_Lightmap'
        );
        mesh.material.lightMap.channel = 1;
        // mesh.material.lightMapIntensity = 10;
      }

      if (mesh.material.name === 'Oven_1B_studio') {
        mesh.material.map = this.textures.getTexture('Studio_Oven_BaseColor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Oven_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Oven_Lightmap');
        mesh.material.lightMap.channel = 1;
        mesh.material.aoMap.channel = 1;
        // mesh.material.lightMapIntensity = 10;
      }

      if (mesh.material.name === 'Fabric_S_studio') {
        mesh.material.map = this.textures.getTexture('Studio_Bed_Basecolor');
        mesh.material.lightMap = this.textures.getTexture(
          'Studio_Bed_Lightmap'
        );
        mesh.material.aoMap = this.textures.getTexture('Studio_Bed_Lightmap');
        mesh.material.lightMap.channel = 1;
        mesh.material.aoMap.channel = 1;
        // mesh.material.lightMapIntensity = 10;
      }

      if (
        [
          'Glass_Bath_S',
          'Glass_Bath_1B',
          'Glass_Bath_2B',
          'Materials_NB_2BA_1',
        ].includes(mesh.name)
      ) {
        mesh.material = this.glassClearMaterial.clone();
        mesh.material.name = `Glass Bath_${modelName}`;
      }

      if (
        [
          'Color_Red_studio',
          'Color_Red_onebed',
          'Color_Red_twobed',
          'Color_Red_XL 8',
        ].includes(mesh.material.name)
      ) {
        mesh.material.color = new Color(0xef1a0b).convertLinearToSRGB();
        mesh.material.roughness = 0.3;
      }

      if (
        ['glassDoor_onebed', 'glassDoor_studio', 'glassDoor_twobed'].includes(
          mesh.material.name
        )
      ) {
        mesh.material = this.glassClearMaterial.clone();
        mesh.material.name = `Glass Door_${modelName}`;
        mesh.material.transmission = 0.2;
      }

      if (
        [
          'glassClear_onebed',
          'glassClear_studio',
          'glassClear_twobed',
          'glassClear_XL 8',
          'glassClear_XL 10',
          'glassDoor_XL 8',
          'glassDoor_XL 10',
        ].includes(mesh.material.name)
      ) {
        mesh.material = this.glassClearMaterial.clone();
        mesh.material.name = `Glass Clear_${modelName}`;
      }

      if (
        ['Air_onebed', 'Air_studio', 'Air_twobed', 'Air_XL 8'].includes(
          mesh.material.name
        )
      ) {
        mesh.material.map = this.textures.getTexture('Air_purification');
        mesh.material.aoMap = this.textures.getTexture('ao_air_ex');
        mesh.material.aoMapIntensity = params.aoMap.air.intensity;
      }

      if (mesh.material.name === 'Color_Exterior_Wood_onebed') {
        mesh.material = this.exteriorWoodMaterial.clone();
        mesh.material.name = 'Base Color Wood Material_onebed';
        mesh.material.aoMap = this.textures.getTexture(
          'exterior_ao_wood_onebed'
        );
      }

      if (mesh.material.name === 'Color_Exterior_Wood_twobed') {
        mesh.material = this.exteriorWoodMaterial.clone();
        mesh.material.name = 'Base Color Wood Material_twobed';
        mesh.material.aoMap = this.textures.getTexture(
          'exterior_ao_wood_twobed'
        );
      }

      if (mesh.material.name === 'Color_Exterior_Wood_XL 8') {
        mesh.material = this.exteriorWoodMaterial.clone();
        mesh.material.name = 'Base Color Wood Material_XL 8';
      }

      if (mesh.material.name === 'Color_Exterior_Wood_studio') {
        mesh.material = this.exteriorWoodMaterial.clone();
        mesh.material.name = 'Base Color Wood Material_studio';
        mesh.material.aoMap = this.textures.getTexture(
          'exterior_ao_wood_studio'
        );
      }

      if (mesh.material.name === 'Color_Exterior_onebed') {
        mesh.material = this.exteriorMaterial.clone();
        mesh.material.name = 'Base Color Material_onebed';
        mesh.material.aoMap = this.textures.getTexture('exterior_ao_onebed');
      }

      if (mesh.material.name === 'Color_Exterior_twobed') {
        mesh.material = this.exteriorMaterial.clone();
        mesh.material.name = 'Base Color Material_twobed';
        mesh.material.aoMap = this.textures.getTexture('exterior_ao_twobed');
      }

      if (mesh.material.name === 'Color_Exterior_XL 8') {
        mesh.material = this.exteriorMaterial.clone();
        mesh.material.name = 'Base Color Material_XL 8';
      }

      if (mesh.material.name === 'Color_Exterior_studio') {
        mesh.material = this.exteriorMaterial.clone();
        mesh.material.name = 'Base Color Material_studio';
        mesh.material.aoMap = this.textures.getTexture('exterior_ao_studio');
      }

      if (
        [
          'Solar_Panel_onebed',
          'Solar_Panel_studio',
          'Solar_Panel_twobed',
          'Solar_Panel_XL 8',
        ].includes(mesh.material.name)
      ) {
        mesh.material.map = this.textures.getTexture('Solar_Panel');
        mesh.material.metalnessMap = this.textures.getTexture(
          'Solar_Panel_metalness'
        );
      }

      if (
        ['Cedar_onebed', 'Cedar_studio', 'Cedar_twobed', 'Cedar_XL 8'].includes(
          mesh.material.name
        )
      ) {
        mesh.material.color = new Color(0xffffff);
        mesh.material.roughness = 0.7;
        mesh.material.aoMap = this.textures.getTexture('cedar_ao_new');
        mesh.material.aoMapIntensity = params.aoMap.desk.intensity;
        mesh.material.map = this.textures.getTexture(
          'Oak_Wood_Varnished_Albedo_2Kt'
        );
      }

      if (
        [
          'Color_ExteriorSupp_onebed',
          'Color_ExteriorSupp_studio',
          'Color_ExteriorSupp_twobed',
          'Color_ExteriorSupp_XL 8',
        ].includes(mesh.material.name)
      ) {
        const name = mesh.material.name;
        mesh.material = this.exteriorMaterial.clone();
        mesh.material.name = name;

        mesh.material.aoMap = this.textures.getTexture('patio_supp_ao');
        mesh.material.aoMapIntensity = params.aoMap.patio.intensity;
      }

      if (mesh.material.name === 'Color_Roof_onebed') {
        mesh.material = this.roofMaterial.clone();
        mesh.material.name = 'Roof Material_onebed';
      }

      if (mesh.material.name === 'Color_Roof_studio') {
        mesh.material = this.roofMaterial.clone();
        mesh.material.name = 'Roof Material_studio';
      }

      if (mesh.material.name === 'Color_Roof_twobed') {
        mesh.material = this.roofMaterial.clone();
        mesh.material.name = 'Roof Material_twobed';
      }

      if (mesh.material.name === 'Color_Roof_XL 8') {
        mesh.material = this.roofMaterial.clone();
        mesh.material.name = 'Roof Material_XL 8';
      }

      // mesh.material.envMap = this.textures.getHdrTexture('hdr-2');
      // mesh.material.envMapIntensity = params.envMap.intensity;

      // Fix materials dublicates and stores them in a Map for later use.
      if (!this.allMaterials.has(mesh.material.name)) {
        this.allMaterials.set(mesh.material.name, mesh.material);
      }
      mesh.material = this.allMaterials.get(mesh.material.name);

      // fix for https://github.com/mrdoob/three.js/issues/27108
      if (
        mesh.material.transmission &&
        !this.transmissiveMaterials.has(mesh.material.name)
      ) {
        const {
          ior,
          transmission,
          color,
          thickness,
          clearcoat,
          clearcoatRoughness,
          roughness,
          name,
        } = mesh.material;

        mesh.material = new MeshTransmissionMaterial(10);
        Object.assign(mesh.material, {
          // clearcoat,
          // clearcoatRoughness,
          transmission,
          roughness,
          thickness,
          ior,
          color,
          name,
          // anisotrophicBlur: 0.5,
          // clearcoat: 1,
        });

        this.transmissiveMaterials.add(mesh.material);
      }
    }
  }
}

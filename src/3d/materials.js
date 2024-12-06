import {
  MeshPhysicalMaterial,
  Color,
  Vector2,
  MeshLambertMaterial,
  Object3D,
  Mesh,
  DoubleSide,
  LinearSRGBColorSpace,
} from 'three';
import { params } from './settings';
import { Textures } from './textures';
import { MeshTransmissionMaterial } from './libs/MeshTransmissionMaterial';

export class Materials {
  constructor() {
    this.textures = new Textures();
    this.allMaterials = new Map();
    this.transmissiveMaterials = new Set();
  }

  setupMaterials(mesh, modelName) {}
}

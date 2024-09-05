// from: https://news.ycombinator.com/item?id=17876741
// reference: http://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/

// eslint-disable-next-line no-unused-vars
const harmoniousNumber = (n = 2, value = 0, depth = 100) => {
  if (depth === 0) return value;

  return (1 + harmoniousNumber(n, value, depth - 1)) ** (1 / n);
};

const g = 1.32471795724474602596090885447809; // Plastic number
const a1 = 1.0 / g;
const a2 = 1.0 / (g * g);
const base = 1.1127756842787055; // harmoniousNumber(7), yields better coverage compared to using 0.5

export const generateR2 = (count) => {
  const points = [];

  for (let n = 0; n < count; n++) {
    points.push([(base + a1 * n) % 1, (base + a2 * n) % 1]);
  }

  return points;
};

export const getR2Index = (n) => {
  return [(base + a1 * n) % 1, (base + a2 * n) % 1];
};

export const getR3Index = (n) => {
  const g = 1.2207440846057596;
  const a1 = 1.0 / g;
  const a2 = 1.0 / (g * g);
  const a3 = 1.0 / (g * g * g);

  return [(base + a1 * n) % 1, (base + a2 * n) % 1, (base + a3 * n) % 1];
};

export const generateR3 = (count) => {
  const g = 1.32471795724474602596090885447809; // Plastic number
  const a1 = 1.0 / g;
  const a2 = 1.0 / (g * g);
  const a3 = 1.0 / (g * g * g);
  const base = 1.1127756842787055; // harmoniousNumber(7), yields better coverage compared to using 0.5

  const points = [];

  for (let n = 0; n < count; n++) {
    points.push([
      (base + a1 * n) % 1,
      (base + a2 * n) % 1,
      (base + a3 * n) % 1,
    ]);
  }

  return points;
};

export const r2Sequence = generateR2(256).map(([a, b]) => [a - 0.5, b - 0.5]);

export function jitter(width, height, camera, frame, jitterScale = 2) {
  const [x, y] = r2Sequence[frame % r2Sequence.length];

  if (camera.setViewOffset) {
    camera.setViewOffset(
      width,
      height,
      x * jitterScale,
      y * jitterScale,
      width,
      height
    );
  }
}

export const isGroundProjectedEnv = (c) => {
  return c.material.fragmentShader.includes(
    'float intersection2 = diskIntersectWithBackFaceCulling( camPos, p, h, vec3( 0.0, 1.0, 0.0 ), radius );'
  );
};

export const isChildMaterialRenderable = (c, material = c.material) => {
  return (
    material.visible &&
    material.depthWrite &&
    material.depthTest &&
    (!material.transparent || material.opacity > 0) &&
    !isGroundProjectedEnv(c)
  );
};

export const didCameraMove = (
  camera,
  lastCameraPosition,
  lastCameraQuaternion
) => {
  if (camera.position.distanceToSquared(lastCameraPosition) > 0.000001) {
    return true;
  }

  if (camera.quaternion.angleTo(lastCameraQuaternion) > 0.001) {
    return true;
  }

  return false;
};

export const getVisibleChildren = (object) => {
  const queue = [object];
  const objects = [];

  while (queue.length !== 0) {
    const mesh = queue.shift();
    if (mesh.material) objects.push(mesh);

    for (const c of mesh.children) {
      if (c.visible) queue.push(c);
    }
  }

  return objects;
};

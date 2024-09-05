uniform sampler2D t1;
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

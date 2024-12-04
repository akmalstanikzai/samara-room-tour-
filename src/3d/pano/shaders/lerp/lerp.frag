uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float mixRatio;
uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;
varying vec2 vUv;
void main() {
  vec4 tex1 = texture2D(texture1, vUv);
  vec4 tex2 = texture2D(texture2, vUv);
  vec4 mixedColor = mix(tex1, tex2, mixRatio);

  // Apply ambient light
  vec3 ambient = ambientLightColor * ambientLightIntensity;
  vec3 finalColor = mixedColor.rgb * ambient;

  gl_FragColor = vec4(finalColor, mixedColor.a);
}
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float mixRatio;
uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;
uniform float warpFactor; // Add warpFactor uniform
uniform float blurFactor; // Add blurFactor uniform
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Warp effect
  vec2 warpedUv = vUv + vec2(warpFactor * (vUv.x - 0.5), 0.0); // Apply warp effect

  // Blur effect (simplified)
  float blur = blurFactor * length(uv - 0.5);
  vec4 tex1 = texture2D(texture1, uv + blur);
  vec4 tex2 = texture2D(texture2, uv + blur);
  vec4 mixedColor = mix(tex1, tex2, mixRatio);

  // Apply ambient light
  vec3 ambient = ambientLightColor * ambientLightIntensity;
  vec3 finalColor = mixedColor.rgb * ambient;

  gl_FragColor = vec4(finalColor, mixedColor.a);
}
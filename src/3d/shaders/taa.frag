varying vec2 vUv;
uniform sampler2D inputTexture;
uniform sampler2D accumulatedTexture;
uniform float notMovedFrames;
uniform float gamma;

void main() {
  vec4 color = linearToOutputTexel(textureLod(inputTexture, vUv, 0.0));
  color = pow(color, vec4(1.0 / gamma));

  if (notMovedFrames == 0.0) {
    gl_FragColor = color;
    return;
  }

  vec4 accumulatedColor = textureLod(accumulatedTexture, vUv, 0.0);
  accumulatedColor = pow(accumulatedColor, vec4(1.0 / gamma));

  gl_FragColor = mix(accumulatedColor, color, 1.0 / (notMovedFrames + 1.0));
}

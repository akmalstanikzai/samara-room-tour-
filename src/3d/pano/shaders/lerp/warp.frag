// forward-warp-fragment-shader.glsl
uniform float uProgress; // Transition progress (0.0 to 1.0)
uniform sampler2D uTexture1; // Texture 1
uniform sampler2D uTexture2; // Texture 2
uniform vec2 uResolution; // Screen resolution
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    // Forward warp distortion
    float strength = 0.5;
    vec2 warp = vec2(uv.x, uv.y - uProgress * strength * (uv.x - 0.5) * (1.0 - uv.y));

    // Blend textures based on progress
    vec4 texture1 = texture2D(uTexture1, warp);
    vec4 texture2 = texture2D(uTexture2, warp + vec2(0.0, uProgress * 0.1));
    vec4 finalColor = mix(texture1, texture2, uProgress);

    gl_FragColor = finalColor;
}

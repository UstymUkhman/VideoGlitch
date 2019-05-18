#include <common>
precision highp float;

uniform sampler2D tDiffuse;

// Overlay Uniforms:
uniform float blur;
uniform int lines;

// RGB Shift Uniforms:
uniform float shift;
uniform float angle;

// Distortion Uniforms:
uniform float distortion;
uniform float speed;

// Glitch Uniforms:
uniform vec3 filterColor;
uniform float amount;
uniform float time;
uniform float snow;

varying vec2 vUv;

vec3 mod289 (vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289 (vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute (vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float snoise (vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;

  x12.xy -= i1;
  i = mod289(i);

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 ox = floor(x + 0.5);
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - ox;
  vec3 g;

  m = m * m;
  m = m * m;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  g.x = a0.x * x0.x + h.x * x0.y;
  return 130.0 * dot(m, g);
}

vec4 horizontalBlur () {
  vec4 res = vec4(0.0);

  res += texture2D(tDiffuse, vec2(vUv.x - 4.0 * blur, vUv.y)) * 0.051;
  res += texture2D(tDiffuse, vec2(vUv.x - 3.0 * blur, vUv.y)) * 0.0918;
  res += texture2D(tDiffuse, vec2(vUv.x - 2.0 * blur, vUv.y)) * 0.12245;
  res += texture2D(tDiffuse, vec2(vUv.x - 1.0 * blur, vUv.y)) * 0.1531;

  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;

  res += texture2D(tDiffuse, vec2(vUv.x + 1.0 * blur, vUv.y)) * 0.1531;
  res += texture2D(tDiffuse, vec2(vUv.x + 2.0 * blur, vUv.y)) * 0.12245;
  res += texture2D(tDiffuse, vec2(vUv.x + 3.0 * blur, vUv.y)) * 0.0918;
  res += texture2D(tDiffuse, vec2(vUv.x + 4.0 * blur, vUv.y)) * 0.051;

  return res;
}

vec4 verticalBlur () {
  vec4 res = vec4(0.0);

  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0 * blur)) * 0.051;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0 * blur)) * 0.0918;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0 * blur)) * 0.12245;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 1.0 * blur)) * 0.1531;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y ) ) * 0.1633;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 1.0 * blur)) * 0.1531;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0 * blur)) * 0.12245;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0 * blur)) * 0.0918;
  res += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0 * blur)) * 0.051;

  return res;
}

void main (void) {
  vec4 color = texture2D(tDiffuse, vUv);

  vec3 result = color.rgb;
  // float lineOpacity = 2.0;
  // float yt = vUv.y - time * speed;

  // if (snow > 0.0) {
  //   lineOpacity += 2.0;
  // }

  // if (shift > 0.0) {
  //   lineOpacity += 3.0;
  // }

  if (lines == 1) {
    float line = sin(vUv.y * 750.0) * 0.5;
    result = color.rgb * vec3(line) * 5.0; // lineOpacity;
    result = color.rgb + 1.0 * (result - color.rgb);
  }

  if (distortion > 0.0) {
    float offset = snoise(vec2((vUv.y - time * speed) * 10.0, 0.0)) * distortion * 0.005;
    vec4 dist = texture2D(tDiffuse, vec2(fract(vUv.x + offset), fract(vUv.y + offset * 2.0)));
    // result = mix(dist.rgb, result, 0.5);
    result = dist.rgb;

    // gl_FragColor = vec4(result, 1.0);
  }

  float b = blur * 512.0 / 5.0;

  result = mix(result, horizontalBlur().rgb, b);
  result = mix(result, verticalBlur().rgb, b);

  // result = mix(result, horizontalBlur().rgb, 0.5);
  // result = mix(result, verticalBlur().rgb, 0.5);

  result += result * (filterColor * 2.0);
  // color = vec4(result, 1.0);

  // float xs = floor(gl_FragCoord.x / snow);
  // float ys = floor(gl_FragCoord.y / snow);

  float xs = floor(gl_FragCoord.x / 1.0);
  float ys = floor(gl_FragCoord.y / 1.0);

  vec2 noise = vec2(xs * time, ys * time);
  color = vec4(result.rgb, 1.0) + vec4(rand(noise) * amount);

  if (shift > 0.0) {
    vec2 offset = shift * vec2(cos(angle), sin(angle));

    vec4 rgbR = texture2D(tDiffuse, vUv + offset);
    vec4 rgbG = texture2D(tDiffuse, vUv);
    vec4 rgbB = texture2D(tDiffuse, vUv - offset);

    vec3 rgb = vec3(rgbR.r, rgbG.g, rgbB.b);
    color = vec4(mix(rgb, color.rgb, 0.5), 1.0);
  }

  gl_FragColor = color;
}

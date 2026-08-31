"use client";

import { useEffect, useRef } from "react";

const VS = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec3 color = vec3(0.96, 0.95, 0.94);
    float warmth = smoothstep(0.3, 1.0, uv.x) * 0.1;
    color += vec3(0.1, 0.05, 0.0) * warmth;
    float noise = fract(sin(dot(uv * vec2(1.0, 50.0) + u_time * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
    float rain = smoothstep(0.98, 1.0, noise) * 0.03;
    float haze = sin(uv.x * 2.0 + u_time * 0.5) * cos(uv.y * 2.0 - u_time * 0.3) * 0.02;
    color -= haze;
    gl_FragColor = vec4(color - rain, 1.0);
}`;

export function AtmosphereShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = el.getContext("webgl") || el.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return;

    function syncSize() {
      const w = el.clientWidth || 1280;
      const h = el.clientHeight || 720;
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
    }
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(el);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    if (!prog) return;
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    if (reduce) {
      gl.viewport(0, 0, el.width, el.height);
      if (uTime) gl.uniform1f(uTime, 0);
      if (uRes) gl.uniform2f(uRes, el.width, el.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return () => ro.disconnect();
    }

    let raf = 0;
    const render = (t: number) => {
      gl.viewport(0, 0, el.width, el.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, el.width, el.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

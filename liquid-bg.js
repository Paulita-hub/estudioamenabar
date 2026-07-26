/**
 * Liquid gradient background (Three.js) — light scheme for Estudio Amenábar
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof THREE === "undefined") return;

  class TouchTexture {
    constructor() {
      this.size = 64;
      this.width = this.height = this.size;
      this.maxAge = 64;
      this.radius = 0.25 * this.size;
      this.speed = 1 / this.maxAge;
      this.trail = [];
      this.last = null;
      this.initTexture();
    }

    initTexture() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.texture = new THREE.Texture(this.canvas);
    }

    update() {
      this.clear();
      const speed = this.speed;
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const point = this.trail[i];
        const f = point.force * speed * (1 - point.age / this.maxAge);
        point.x += point.vx * f;
        point.y += point.vy * f;
        point.age++;
        if (point.age > this.maxAge) this.trail.splice(i, 1);
        else this.drawPoint(point);
      }
      this.texture.needsUpdate = true;
    }

    clear() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addTouch(point) {
      let force = 0;
      let vx = 0;
      let vy = 0;
      const last = this.last;
      if (last) {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx === 0 && dy === 0) return;
        const dd = dx * dx + dy * dy;
        const d = Math.sqrt(dd);
        vx = dx / d;
        vy = dy / d;
        force = Math.min(dd * 20000, 2.0);
      }
      this.last = { x: point.x, y: point.y };
      this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
    }

    drawPoint(point) {
      const pos = {
        x: point.x * this.width,
        y: (1 - point.y) * this.height,
      };
      let intensity = 1;
      if (point.age < this.maxAge * 0.3) {
        intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
      } else {
        const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
        intensity = -t * (t - 2);
      }
      intensity *= point.force;
      const radius = this.radius;
      const color = `${((point.vx + 1) / 2) * 255}, ${
        ((point.vy + 1) / 2) * 255
      }, ${intensity * 255}`;
      const offset = this.size * 5;
      this.ctx.shadowOffsetX = offset;
      this.ctx.shadowOffsetY = offset;
      this.ctx.shadowBlur = radius;
      this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
      this.ctx.beginPath();
      this.ctx.fillStyle = "rgba(255,0,0,1)";
      this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  function hexToVec3(hex) {
    const raw = String(hex || "").replace("#", "").trim();
    if (raw.length !== 6) return null;
    const n = parseInt(raw, 16);
    if (Number.isNaN(n)) return null;
    return new THREE.Vector3(
      ((n >> 16) & 255) / 255,
      ((n >> 8) & 255) / 255,
      (n & 255) / 255
    );
  }

  function readLiquidPalette() {
    const raw = document.body?.dataset?.liquidColors || "";
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(hexToVec3)
      .filter(Boolean);

    if (parts.length >= 2) {
      const base = parts[0];
      const accents = parts.slice(1);
      const src = accents.slice();
      while (accents.length < 6) {
        accents.push(src[accents.length % src.length].clone());
      }
      return { base, accents: accents.slice(0, 6), custom: true };
    }

    // Default site palette: white base + orange + navy
    return {
      base: new THREE.Vector3(1, 1, 1),
      accents: [
        new THREE.Vector3(0.945, 0.353, 0.133), // #F15A22
        new THREE.Vector3(0.039, 0.055, 0.153), // #0A0E27
        new THREE.Vector3(0.945, 0.353, 0.133),
        new THREE.Vector3(0.945, 0.353, 0.133),
        new THREE.Vector3(0.039, 0.055, 0.153),
        new THREE.Vector3(0.945, 0.353, 0.133),
      ],
      custom: false,
    };
  }

  class GradientBackground {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.mesh = null;
      const palette = readLiquidPalette();
      const [a1, a2, a3, a4, a5, a6] = palette.accents;
      this.uniforms = {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uColor1: { value: a1.clone() },
        uColor2: { value: a2.clone() },
        uColor3: { value: a3.clone() },
        uColor4: { value: a4.clone() },
        uColor5: { value: a5.clone() },
        uColor6: { value: a6.clone() },
        uSpeed: { value: palette.custom ? 1.1 : 1.5 },
        uIntensity: { value: palette.custom ? 1.15 : 1.8 },
        uTouchTexture: { value: null },
        uGrainIntensity: { value: palette.custom ? 0.035 : 0.06 },
        uZoom: { value: 1.0 },
        uBase: { value: palette.base.clone() },
        uGradientSize: { value: palette.custom ? 0.58 : 0.45 },
        uGradientCount: { value: palette.custom ? 8.0 : 12.0 },
        uColor1Weight: { value: palette.custom ? 1.0 : 0.5 },
        uColor2Weight: { value: palette.custom ? 1.0 : 1.8 },
        uMinColorMix: { value: palette.custom ? 0.9 : 0.15 },
        uSaturation: { value: palette.custom ? 1.9 : 1.35 },
        uVibrant: { value: palette.custom ? 1.0 : 0.0 },
      };
    }

    init() {
      const viewSize = this.sceneManager.getViewSize();
      const geometry = new THREE.PlaneGeometry(
        viewSize.width,
        viewSize.height,
        1,
        1
      );
      const material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vUv = uv;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform vec3 uColor4;
          uniform vec3 uColor5;
          uniform vec3 uColor6;
          uniform float uSpeed;
          uniform float uIntensity;
          uniform sampler2D uTouchTexture;
          uniform float uGrainIntensity;
          uniform vec3 uBase;
          uniform float uGradientSize;
          uniform float uGradientCount;
          uniform float uColor1Weight;
          uniform float uColor2Weight;
          uniform float uMinColorMix;
          uniform float uSaturation;
          uniform float uVibrant;
          varying vec2 vUv;

          float grain(vec2 uv, float time) {
            vec2 grainUv = uv * uResolution * 0.5;
            float g = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
            return g * 2.0 - 1.0;
          }

          vec3 saturateColor(vec3 color, float amount) {
            float lum = dot(color, vec3(0.299, 0.587, 0.114));
            return clamp(mix(vec3(lum), color, amount), 0.0, 1.0);
          }

          vec3 getGradientColor(vec2 uv, float time) {
            float r = uGradientSize;
            vec2 c1 = vec2(0.18 + sin(time * uSpeed * 0.35) * 0.12, 0.28 + cos(time * uSpeed * 0.4) * 0.14);
            vec2 c2 = vec2(0.52 + cos(time * uSpeed * 0.45) * 0.16, 0.42 + sin(time * uSpeed * 0.38) * 0.15);
            vec2 c3 = vec2(0.72 + sin(time * uSpeed * 0.32) * 0.14, 0.22 + cos(time * uSpeed * 0.48) * 0.12);
            vec2 c4 = vec2(0.62 + cos(time * uSpeed * 0.4) * 0.15, 0.72 + sin(time * uSpeed * 0.36) * 0.14);
            vec2 c5 = vec2(0.86 + sin(time * uSpeed * 0.5) * 0.1, 0.78 + cos(time * uSpeed * 0.42) * 0.12);
            vec2 c6 = vec2(0.28 + cos(time * uSpeed * 0.38) * 0.14, 0.78 + sin(time * uSpeed * 0.44) * 0.12);
            vec2 c7 = vec2(0.4 + sin(time * uSpeed * 0.42) * 0.16, 0.55 + cos(time * uSpeed * 0.36) * 0.14);
            vec2 c8 = vec2(0.78 + cos(time * uSpeed * 0.46) * 0.12, 0.48 + sin(time * uSpeed * 0.4) * 0.14);

            float i1 = 1.0 - smoothstep(0.0, r, length(uv - c1));
            float i2 = 1.0 - smoothstep(0.0, r * 1.05, length(uv - c2));
            float i3 = 1.0 - smoothstep(0.0, r * 0.95, length(uv - c3));
            float i4 = 1.0 - smoothstep(0.0, r, length(uv - c4));
            float i5 = 1.0 - smoothstep(0.0, r * 0.9, length(uv - c5));
            float i6 = 1.0 - smoothstep(0.0, r, length(uv - c6));
            float i7 = 1.0 - smoothstep(0.0, r * 0.85, length(uv - c7));
            float i8 = 1.0 - smoothstep(0.0, r * 0.9, length(uv - c8));

            if (uVibrant > 0.5) {
              // Mix blend keeps hues vivid (additive was muddying to gray)
              vec3 color = uBase;
              color = mix(color, uColor1, clamp(i1 * 0.92, 0.0, 1.0));
              color = mix(color, uColor2, clamp(i2 * 0.9, 0.0, 1.0));
              color = mix(color, uColor3, clamp(i3 * 0.88, 0.0, 1.0));
              color = mix(color, uColor4, clamp(i4 * 0.9, 0.0, 1.0));
              color = mix(color, uColor5, clamp(i5 * 0.92, 0.0, 1.0));
              color = mix(color, uColor6, clamp(i6 * 0.88, 0.0, 1.0));
              if (uGradientCount > 6.0) {
                color = mix(color, uColor1, clamp(i7 * 0.55, 0.0, 1.0));
                color = mix(color, uColor3, clamp(i8 * 0.55, 0.0, 1.0));
              }
              color = saturateColor(color, uSaturation);
              return clamp(color * uIntensity, 0.0, 1.0);
            }

            vec2 c9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
            vec2 c10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
            vec2 c11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
            vec2 c12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);
            float i9 = 1.0 - smoothstep(0.0, r, length(uv - c9));
            float i10 = 1.0 - smoothstep(0.0, r, length(uv - c10));
            float i11 = 1.0 - smoothstep(0.0, r, length(uv - c11));
            float i12 = 1.0 - smoothstep(0.0, r, length(uv - c12));

            vec2 rotatedUv1 = uv - 0.5;
            float angle1 = time * uSpeed * 0.15;
            rotatedUv1 = vec2(
              rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
              rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
            ) + 0.5;
            vec2 rotatedUv2 = uv - 0.5;
            float angle2 = -time * uSpeed * 0.12;
            rotatedUv2 = vec2(
              rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
              rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
            ) + 0.5;
            float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv1 - 0.5));
            float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv2 - 0.5));

            vec3 color = vec3(0.0);
            color += uColor1 * i1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
            color += uColor2 * i2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
            color += uColor3 * i3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
            color += uColor4 * i4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
            color += uColor5 * i5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
            color += uColor6 * i6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;
            if (uGradientCount > 6.0) {
              color += uColor1 * i7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
              color += uColor2 * i8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
              color += uColor3 * i9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
              color += uColor4 * i10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
            }
            if (uGradientCount > 10.0) {
              color += uColor5 * i11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
              color += uColor6 * i12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
            }

            color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
            color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;

            color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
            color = saturateColor(color, uSaturation);
            float bright = length(color);
            color = mix(uBase, color, clamp(max(bright * 1.15, uMinColorMix), 0.0, 1.0));
            if (bright > 1.15) color *= 1.15 / bright;
            return clamp(color, vec3(0.0), vec3(1.0));
          }

          void main() {
            vec2 uv = vUv;
            vec4 touchTex = texture2D(uTouchTexture, uv);
            float vx = -(touchTex.r * 2.0 - 1.0);
            float vy = -(touchTex.g * 2.0 - 1.0);
            float intensity = touchTex.b;
            uv.x += vx * 0.55 * intensity;
            uv.y += vy * 0.55 * intensity;
            vec2 center = vec2(0.5);
            float dist = length(uv - center);
            float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.03 * intensity;
            float wave = sin(dist * 15.0 - uTime * 2.0) * 0.02 * intensity;
            uv += vec2(ripple + wave);

            vec3 color = getGradientColor(uv, uTime);
            color += grain(uv, uTime) * uGrainIntensity;
            if (uVibrant < 0.5) {
              float bright = length(color);
              color = mix(uBase, color, clamp(max(bright * 1.1, uMinColorMix), 0.0, 1.0));
            }
            color = saturateColor(color, uSaturation);
            gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
          }
        `,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.sceneManager.scene.add(this.mesh);
    }

    update(delta) {
      this.uniforms.uTime.value += delta;
    }

    onResize(width, height) {
      const viewSize = this.sceneManager.getViewSize();
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.PlaneGeometry(
          viewSize.width,
          viewSize.height,
          1,
          1
        );
      }
      this.uniforms.uResolution.value.set(width, height);
    }
  }

  class LiquidApp {
    constructor() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: false,
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.domElement.id = "liquid-bg";
      this.renderer.domElement.setAttribute("aria-hidden", "true");
      document.body.prepend(this.renderer.domElement);

      this.camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
      );
      this.camera.position.z = 50;
      this.scene = new THREE.Scene();
      const palette = readLiquidPalette();
      this.scene.background = new THREE.Color(
        palette.base.x,
        palette.base.y,
        palette.base.z
      );
      document.body.style.backgroundColor = `rgb(${Math.round(palette.base.x * 255)}, ${Math.round(palette.base.y * 255)}, ${Math.round(palette.base.z * 255)})`;
      this.clock = new THREE.Clock();

      this.touchTexture = new TouchTexture();
      this.gradientBackground = new GradientBackground(this);
      this.gradientBackground.uniforms.uTouchTexture.value =
        this.touchTexture.texture;

      this.gradientBackground.init();
      this.tick();

      window.addEventListener("resize", () => this.onResize());
      window.addEventListener("mousemove", (ev) => this.onMouseMove(ev), {
        passive: true,
      });
      window.addEventListener("touchmove", (ev) => this.onTouchMove(ev), {
        passive: true,
      });
    }

    onTouchMove(ev) {
      const touch = ev.touches[0];
      if (!touch) return;
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    onMouseMove(ev) {
      this.touchTexture.addTouch({
        x: ev.clientX / window.innerWidth,
        y: 1 - ev.clientY / window.innerHeight,
      });
    }

    getViewSize() {
      const fovInRadians = (this.camera.fov * Math.PI) / 180;
      const height = Math.abs(
        this.camera.position.z * Math.tan(fovInRadians / 2) * 2
      );
      return { width: height * this.camera.aspect, height };
    }

    render() {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.touchTexture.update();
      this.gradientBackground.update(delta);
      this.renderer.render(this.scene, this.camera);
    }

    tick() {
      this.render();
      requestAnimationFrame(() => this.tick());
    }

    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.gradientBackground.onResize(window.innerWidth, window.innerHeight);
    }
  }

  function start() {
    // eslint-disable-next-line no-new
    new LiquidApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

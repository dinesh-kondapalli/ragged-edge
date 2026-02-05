import {W as S, b as E, O as L, V as C, L as v, R as T, c as b, P as F, M, T as A} from "./app-LpT9mD6r.js";
const X = "\n// openingCreditsVertexShader.js\nvarying vec2 vTexCoord;\n\nvoid main() {\n    vTexCoord = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}"
  , z = "\n  precision mediump float;\n  uniform sampler2D videoTexture;\n  uniform float shiftAmount;\n  varying vec2 vTexCoord;\n\n  void main() {\n      vec2 uv = vTexCoord;\n\n      // Parabolic ramp: 0 at top/bottom, 1 in the middle\n      float ramp = 1.0 - pow(2.0 * (uv.y - 0.5), 2.0);\n\n      // Compute potential shifted UV\n      float shiftedX = uv.x + shiftAmount * ramp;\n\n      // Falloff near edges using smoothstep (soft limit rather than hard clamp)\n      float fade = smoothstep(0.0, 0.5, shiftedX) * (1.0 - smoothstep(0.5, 1.0, shiftedX)); // Avoids clamped distortion \n\n      // Apply smoothed shift\n      uv.x = mix(uv.x, shiftedX, fade);\n\n      // Sample video texture\n      gl_FragColor = texture2D(videoTexture, uv);\n  }";
function B({node: P}) {
    const e = document.getElementById("video-opening-sequence")
      , m = document.getElementById("header-home");
    if (!e || !m)
        return () => {}
        ;
    if (e.play(),
    window.matchMedia("(pointer: coarse)").matches)
        return e.classList.remove("opacity-0"),
        () => {}
        ;
    let t = document.getElementById("hero-canvas");
    t || (t = document.createElement("canvas"),
    t.id = "hero-canvas",
    t.className = "fixed top-0 left-0 w-full h-full pointer-events-none",
    m.appendChild(t));
    const i = new S({
        canvas: t,
        alpha: !0,
        antialias: !0
    })
      , c = new E
      , h = new L(-1,1,1,-1,0,1)
      , o = new C(e);
    o.minFilter = v,
    o.magFilter = v,
    o.format = T;
    const r = new b({
        uniforms: {
            videoTexture: {
                value: o
            },
            shiftAmount: {
                value: 0
            },
            curveStrength: {
                value: .5
            },
            edgeWarp: {
                value: .3
            }
        },
        vertexShader: X,
        fragmentShader: z
    })
      , f = new F(2,2)
      , p = new M(f,r);
    c.add(p),
    e.style.opacity = "0";
    const a = () => {
        i.setSize(window.innerWidth, window.innerHeight, !1)
    }
    ;
    window.addEventListener("resize", a),
    a();
    let u = 0
      , s = 0;
    const g = .1;
    function w(d) {
        u = (d / window.innerWidth * 2 - 1) * -.2
    }
    const l = d => w(d.clientX);
    document.addEventListener("mousemove", l);
    const n = () => {
        e.play(),
        document.removeEventListener("touchstart", n),
        document.removeEventListener("click", n)
    }
    ;
    e.paused && (document.addEventListener("touchstart", n),
    document.addEventListener("click", n)),
    document.addEventListener("visibilitychange", () => {
        document.visibilityState === "visible" && e.paused && e.play()
    }
    );
    function x() {
        e.readyState >= 3 && (o.needsUpdate = !0),
        s += (u - s) * g,
        r.uniforms.shiftAmount.value = s,
        r.uniforms.curveStrength.value = .5 + Math.sin(Date.now() * .001) * .1,
        i.render(c, h)
    }
    const y = A.add(x, {
        priority: 1,
        fps: 60
    });
    return () => {
        window.removeEventListener("resize", a),
        document.removeEventListener("mousemove", l),
        document.removeEventListener("touchstart", n),
        document.removeEventListener("click", n),
        t && t.parentNode && t.parentNode.removeChild(t),
        i.dispose(),
        y()
    }
}
export {B as default};
//# sourceMappingURL=OpeningCredits-BivqJm8d.js.map

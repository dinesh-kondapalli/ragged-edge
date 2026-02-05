import {_ as C, j as T, h as z, g as I} from "./app-LpT9mD6r.js";
function j({node: c, plugins: {inview: r, device: u}}) {
    var A, x, q;
    const e = c.querySelector("video");
    if (!e)
        return () => {}
        ;
    let d = !0
      , f = !0
      , h = [];
    const M = window.matchMedia("(pointer: fine)").matches ? "mouse" : "touch"
      , n = (A = e.querySelector("source[data-mobile-src]")) != null ? A : null
      , i = (x = e.querySelector("source[data-desktop-src]")) != null ? x : null
      , v = (q = c.querySelector(".video-poster-image__img")) != null ? q : null
      , P = () => {
        v && M === "touch" && I.to(v, {
            opacity: 0,
            duration: .3,
            delay: .3,
            ease: "linear"
        })
    }
    ;
    let m = !1
      , s = !1
      , p = null;
    function y(t) {
        if (p !== t) {
            if (p = t,
            t === "desktop" && i) {
                const l = i.dataset.desktopSrc;
                i.src = l,
                e.src = l,
                n && n.removeAttribute("src")
            } else if (t === "mobile" && n) {
                const l = n.dataset.mobileSrc;
                n.src = l,
                e.src = l,
                i && i.removeAttribute("src")
            } else
                return;
            e.addEventListener("canplay", () => {
                P()
            }
            , {
                once: !0
            }),
            m || (e.load(),
            m = !0),
            e.hasAttribute("autoplay") && e.play().catch( () => {
                console.log("autoplay error", e)
            }
            )
        }
    }
    function V() {
        s = !0;
        const t = window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
        y(t),
        e.hasAttribute("autoplay") && d && e.play().catch( () => {}
        )
    }
    function _() {
        s = !1,
        e.paused || (e.pause(),
        e.preload = "metadata")
    }
    r.settings = {
        rootMargin: "0px 0px 50% 0px",
        threshold: 0
    },
    r.observe(e, {
        enter: V,
        exit: _
    }),
    u.at("(min-width: 768px)", {
        on() {
            s && y("desktop")
        },
        off() {
            s && y("mobile")
        }
    });
    function E() {
        h = [...document.querySelectorAll("video[data-playing]")],
        h.forEach(t => {
            t !== e && S(t)
        }
        )
    }
    function b() {
        d = !1,
        e.paused ? (E(),
        e.play()) : e.pause()
    }
    function w(t=e) {
        E(),
        t.volume = 1,
        t.muted = !1,
        t.removeAttribute("muted"),
        f = !1
    }
    function S(t=e) {
        t.volume = 0,
        t.muted = !0,
        t.setAttribute("muted", !0),
        f = !0
    }
    function g() {
        d = !1,
        f ? w() : S()
    }
    function k() {
        e.setAttribute("data-playing", !0)
    }
    function L() {
        e.removeAttribute("data-playing")
    }
    e.addEventListener("play", k),
    e.addEventListener("pause", L);
    const o = c.querySelector("[data-play]")
      , a = c.querySelector("[data-volume]");
    return o == null || o.addEventListener("click", b),
    a == null || a.addEventListener("click", g),
    () => {
        r && typeof r.disconnect == "function" && r.disconnect(),
        u && typeof u.cancel == "function" && u.cancel(),
        e.removeEventListener("play", k),
        e.removeEventListener("pause", L),
        o == null || o.removeEventListener("click", b),
        a == null || a.removeEventListener("click", g),
        m = !1,
        s = !1,
        p = null
    }
}
const D = C(T, z)(j);
export {D as default};
//# sourceMappingURL=LazyVideo-CTUogpyd.js.map

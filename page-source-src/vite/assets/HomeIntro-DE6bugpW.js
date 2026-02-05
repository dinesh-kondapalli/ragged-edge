import {_ as I, j as T, h as H, g as r, S as k, a as R} from "./app-LpT9mD6r.js";
/*! js-cookie v3.0.5 | MIT */
function y(e) {
    for (var a = 1; a < arguments.length; a++) {
        var c = arguments[a];
        for (var i in c)
            e[i] = c[i]
    }
    return e
}
var A = {
    read: function(e) {
        return e[0] === '"' && (e = e.slice(1, -1)),
        e.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    },
    write: function(e) {
        return encodeURIComponent(e).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
    }
};
function S(e, a) {
    function c(o, p, t) {
        if (!(typeof document > "u")) {
            t = y({}, a, t),
            typeof t.expires == "number" && (t.expires = new Date(Date.now() + t.expires * 864e5)),
            t.expires && (t.expires = t.expires.toUTCString()),
            o = encodeURIComponent(o).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
            var u = "";
            for (var s in t)
                t[s] && (u += "; " + s,
                t[s] !== !0 && (u += "=" + t[s].split(";")[0]));
            return document.cookie = o + "=" + e.write(p, o) + u
        }
    }
    function i(o) {
        if (!(typeof document > "u" || arguments.length && !o)) {
            for (var p = document.cookie ? document.cookie.split("; ") : [], t = {}, u = 0; u < p.length; u++) {
                var s = p[u].split("=")
                  , h = s.slice(1).join("=");
                try {
                    var n = decodeURIComponent(s[0]);
                    if (t[n] = e.read(h, n),
                    o === n)
                        break
                } catch (m) {}
            }
            return o ? t[o] : t
        }
    }
    return Object.create({
        set: c,
        get: i,
        remove: function(o, p) {
            c(o, "", y({}, p, {
                expires: -1
            }))
        },
        withAttributes: function(o) {
            return S(this.converter, y({}, this.attributes, o))
        },
        withConverter: function(o) {
            return S(y({}, this.converter, o), this.attributes)
        }
    }, {
        attributes: {
            value: Object.freeze(a)
        },
        converter: {
            value: Object.freeze(e)
        }
    })
}
var x = S(A, {
    path: "/"
});
r.registerPlugin(R);
function L({node: e, plugins: {inview: a, device: c}}) {
    var $;
    let i = null;
    const o = document.getElementById("header")
      , p = document.getElementById("HomeHero")
      , t = e.querySelector('[data-trigger="start"]')
      , u = e.querySelector('[data-trigger="end"]')
      , s = e.querySelector("[data-locked]")
      , h = e.querySelector("[data-collector]");
    let n = document.querySelector("#video-opening-sequence");
    const m = e.querySelector(".o-logo")
      , d = e.querySelector(".header-top-bar")
      , f = e.querySelector(".header-bottom-bar")
      , B = e.querySelector(".c-nav--home")
      , w = e.querySelector("[data-menu-opener-hero]");
    let l = ($ = e.querySelector("#hero-canvas")) != null ? $ : null;
    l || (window.matchMedia("(pointer: coarse)").matches ? n.addEventListener("canplay", () => {
        n.classList.remove("opacity-0"),
        n.play()
    }
    ) : (l = document.createElement("canvas"),
    l.id = "hero-canvas",
    l.classList.add("fixed", "top-0", "left-0", "w-full", "h-full", "pointer-events-none"),
    e.appendChild(l)));
    let v = null
      , q = x.get("homepageAnimationComplete");
    const C = [...document.querySelectorAll("[data-mud-craft-core-cookie-wrapper],[data-mud-craft-core-cache-notice-wrapper],[data-mud-craft-core-cookie-open]")];
    return scrollY >= innerHeight && o.classList.add("not-at-top"),
    a.observe(e, {
        enter: () => {
            var g;
            n = (g = document.querySelector("#video-opening-sequence")) != null ? g : null,
            r.to(p, {
                duration: .25,
                ease: "linear",
                color: "#ffffff"
            }),
            r.to(C, {
                opacity: 0,
                duration: .3,
                y: "100%",
                ease: "linear"
            }),
            l ? r.to(l, {
                duration: .25,
                ease: "linear",
                opacity: 1
            }) : r.to(n, {
                duration: .25,
                ease: "linear",
                opacity: 1,
                onStart: () => {
                    n && n.play()
                }
            }),
            o.classList.remove("not-at-top")
        }
        ,
        exit: () => {
            r.to(p, {
                duration: .25,
                ease: "linear",
                color: "#181F1F"
            }),
            r.to(C, {
                opacity: 1,
                duration: .3,
                y: 0,
                ease: "linear"
            }),
            l ? r.to(l, {
                duration: .25,
                ease: "linear",
                opacity: 0
            }) : r.to(n, {
                duration: .25,
                ease: "linear",
                opacity: 0,
                onComplete: () => {
                    n.pause()
                }
            }),
            o.classList.add("not-at-top")
        }
    }, {
        root: null,
        rootMargin: "-20% 0% 20% 0%",
        threshold: 0
    }),
    c.at("(min-width:768px)", {
        on: () => {
            i = r.to(s, {
                scrollTrigger: {
                    trigger: t,
                    start: "top top",
                    endTrigger: u,
                    end: () => "-=".concat(s.offsetHeight / 2 + h.offsetHeight, "px top"),
                    pin: !0,
                    anticipatePin: 1
                }
            })
        }
        ,
        off: () => {
            i && typeof i.kill == "function" && i.scrollTrigger.kill()
        }
    }),
    q ? (d && d.remove(),
    f && f.remove(),
    r.set(m, {
        scale: 1,
        opacity: 1,
        backgroundColor: "transparent"
    }),
    r.set(w, {
        opacity: 1
    })) : (r.set(C, {
        opacity: 0
    }),
    r.set(l, {
        scale: 1.5
    }),
    v = r.timeline({
        paused: 1,
        delay: 1,
        onStart: () => {
            k.emit("scroll:pause", {
                toTop: !0
            })
        }
        ,
        onComplete: () => {
            k.emit("scroll:play"),
            q = x.set("homepageAnimationComplete", !0, {
                expires: 7
            })
        }
    }),
    v.to(d, {
        y: -10,
        duration: .2,
        scaleX: 2,
        ease: "power4.in"
    }).to(f, {
        y: 10,
        scaleX: 2,
        duration: .2,
        ease: "power4.in"
    }, "<").to(d, {
        y: "-100%",
        borderRadius: "0 0 50% 50%",
        scaleX: 1,
        duration: .5,
        ease: "power4.in",
        onComplete: () => {
            d.remove()
        }
    }, 1.5).to(f, {
        y: "100%",
        borderRadius: "50% 50% 0 0",
        scale: 1,
        duration: .5,
        ease: "power4.in",
        onComplete: () => {
            f.remove()
        }
    }, "<").to(l, {
        scale: 1,
        duration: .5,
        ease: "power4.in"
    }, "<").fromTo(m, {
        scaleX: 1.15,
        scaleY: 0
    }, {
        scaleY: 1,
        scaleX: 1,
        duration: 1,
        ease: "power4.out"
    }, 1.7).to(m, {
        backgroundColor: "transparent",
        duration: .1,
        ease: "power4.out"
    }, "<0.04").fromTo(B, {
        y: "100%"
    }, {
        y: 0,
        duration: .5,
        ease: "power4.out"
    }, 2.25).to(w, {
        opacity: 1
    }),
    v.play()),
    () => {
        if (i && (i.kill(),
        i = null),
        a && typeof a.disconnect == "function")
            try {
                a.disconnect(),
                a = null
            } catch (g) {
                console.warn("inview.disconnect() failed:", g)
            }
        c && typeof c.cancel == "function" && (c.cancel(),
        c = null)
    }
}
const j = I(T, H)(L);
export {j as default};
//# sourceMappingURL=HomeIntro-DE6bugpW.js.map

"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const diatypeExtendedBold = localFont({
  src: "../fonts/ABCDiatypeExpanded-Bold-Trial.otf",
  weight: "900",
  style: "normal",
  display: "swap",
});

const gritRegular = localFont({
  src: "../fonts/Grit-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-grit",
});

const vertexShader = `
  varying vec2 vTexCoord;
  
  void main() {
    vTexCoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  
  uniform sampler2D videoTexture;
  uniform float shiftAmount;
  uniform float curveStrength;
  uniform float uTime;
  
  varying vec2 vTexCoord;
  
  void main() {
    vec2 uv = vTexCoord;
    
    // Parabolic ramp: 0 at top/bottom, 1 in the middle
    float ramp = 1.0 - pow(2.0 * (uv.y - 0.5), 2.0);
    
    // Compute potential shifted UV
    float shiftedX = uv.x + shiftAmount * ramp;
    
    // Falloff near edges using smoothstep (soft limit rather than hard clamp)
    float fade = smoothstep(0.0, 0.5, shiftedX) * (1.0 - smoothstep(0.5, 1.0, shiftedX));
    
    // Apply smoothed shift
    uv.x = mix(uv.x, shiftedX, fade);
    
    // Sample video texture
    vec4 color = texture2D(videoTexture, uv);
    
    gl_FragColor = color;
  }
`;

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasError, setHasError] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const targetShiftRef = useRef(0);
  const currentShiftRef = useRef(0);
  const mouseHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(isTouchDevice);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("Video or canvas ref not available");
      return;
    }

    console.log("Initializing WebGL video background...");
    console.log("Video element:", video);
    console.log("Video src:", video.querySelector("source")?.src);

    const handleVideoLoad = () => {
      console.log("Video loaded successfully - readyState:", video.readyState);
    };

    const handleVideoError = (e: Event) => {
      console.error("Video failed to load:", e);
      console.error("Video error code:", video.error?.code);
      console.error("Video error message:", video.error?.message);
      setHasError(true);
    };

    const handleCanPlayThrough = () => {
      console.log("Video can play through");
    };

    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded - duration:", video.duration);
    };

    video.addEventListener("loadeddata", handleVideoLoad);
    video.addEventListener("error", handleVideoError);
    video.addEventListener("canplaythrough", handleCanPlayThrough);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 2) {
      console.log("Video already loaded (readyState:", video.readyState, ")");
    }

    if (isTouchDevice) {
      console.log("Mobile device detected, using native video");
      video.classList.remove("opacity-0");
      video.play().catch((err) => {
        console.log("Auto-play blocked on mobile:", err);
      });
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTextureRef.current = videoTexture;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        videoTexture: { value: videoTexture },
        shiftAmount: { value: 0.0 },
        curveStrength: { value: 0.5 },
        uTime: { value: 0.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);
    handleResize();

    const lerpFactor = 0.1;

    const updateShift = (x: number) => {
      const normalizedX = (x / window.innerWidth) * 2 - 1;
      targetShiftRef.current = normalizedX * -0.2;
    };

    const mouseHandler = (e: MouseEvent) => {
      updateShift(e.clientX);
    };
    mouseHandlerRef.current = mouseHandler;
    document.addEventListener("mousemove", mouseHandler);

    const forcePlay = () => {
      video.play().catch(() => {});
      document.removeEventListener("touchstart", forcePlay);
      document.removeEventListener("click", forcePlay);
    };

    if (video.paused) {
      document.addEventListener("touchstart", forcePlay);
      document.addEventListener("click", forcePlay);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && video.paused) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = () => {
      if (video.readyState >= 3) {
        videoTexture.needsUpdate = true;
      }

      currentShiftRef.current +=
        (targetShiftRef.current - currentShiftRef.current) * lerpFactor;

      if (materialRef.current) {
        materialRef.current.uniforms.shiftAmount.value =
          currentShiftRef.current;
        materialRef.current.uniforms.curveStrength.value =
          0.5 + Math.sin(Date.now() * 0.001) * 0.1;
        materialRef.current.uniforms.uTime.value = Date.now() * 0.001;
      }

      renderer.render(scene, camera);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    const handleCanPlay = () => {
      rafIdRef.current = requestAnimationFrame(animate);
    };
    video.addEventListener("canplay", handleCanPlay);

    video.play().catch(() => {});

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", mouseHandler);
      document.removeEventListener("touchstart", forcePlay);
      document.removeEventListener("click", forcePlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleVideoLoad);
      video.removeEventListener("error", handleVideoError);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      geometry.dispose();
      material.dispose();
      videoTexture.dispose();
      renderer.dispose();
    };
  }, []);

  const handleManualPlay = () => {
    const video = videoRef.current;
    if (video) {
      video
        .play()
        .then(() => {
          console.log("Video playing after manual interaction");
        })
        .catch((err) => {
          console.error("Failed to play video:", err);
        });
    }
  };

  return (
    <main className="relative min-h-screen">
      <video
        ref={videoRef}
        id="video-opening-sequence"
        className={`fixed top-0 left-0 w-full h-full object-cover ${isMobile ? "opacity-100" : "opacity-0"} z-0`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/home-hero--desktop.mp4" type="video/mp4" />
      </video>

      {!isMobile && (
        <canvas
          ref={canvasRef}
          id="hero-canvas"
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
        />
      )}

      {hasError && (
        <button
          type="button"
          className="fixed inset-0 z-[6] flex items-center justify-center bg-black/80 cursor-pointer border-none"
          onClick={handleManualPlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleManualPlay();
            }
          }}
        >
          <div className="text-white text-center p-8">
            <p className="text-xl mb-4">Click to play video</p>
            <span className="inline-block px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors">
              Play Video
            </span>
          </div>
        </button>
      )}

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen flex flex-col"
      >
        <section className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full flex justify-center overflow-hidden px-4">
            <h1
              className={`${diatypeExtendedBold.className} text-white font-bold uppercase select-none whitespace-nowrap`}
              style={{
                fontSize: "clamp(2.5rem, 8.4vw, 7.4rem)",
                lineHeight: "0.9",
                fontWeight: "900",
                transform: "scaleX(1.7) scaleY(0.92)",
                transformOrigin: "center center",
                WebkitTextStroke: "6.5px white",
                paintOrder: "stroke fill",
              }}
            >
              RAGGED EDGE
            </h1>
          </div>
        </section>

        <nav className="fixed bottom-6 left-0 right-0 mb-4 px-7 flex justify-between items-center z-20 text-md">
          <div className="flex gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/90 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Home
            </a>
            <a
              href="#partnerships"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/60 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Partnerships
            </a>
            <a
              href="#approach"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/60 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Approach
            </a>
            <a
              href="#happenings"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/60 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Happenings
            </a>
          </div>

          <div className="flex gap-2">
            <a
              href="#join"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/60 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Join
            </a>
            <a
              href="#contact"
              target="_blank"
              rel="noopener noreferrer"
              className={`${gritRegular.className} px-4 py-2 bg-white/60 hover:bg-[#A0FFFF] text-black rounded-full transition-all duration-200`}
            >
              Contact
            </a>
          </div>
        </nav>
      </div>
    </main>
  );
}

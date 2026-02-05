"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Vertex Shader - Simple UV passthrough
const vertexShader = `
  varying vec2 vTexCoord;
  
  void main() {
    vTexCoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader - Parabolic distortion with cursor tracking
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Three.js refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Mouse tracking refs
  const targetShiftRef = useRef(0);
  const currentShiftRef = useRef(0);
  const mouseHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check for mobile/touch device
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(isTouchDevice);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("Video or canvas ref not available");
      return;
    }

    console.log("Initializing WebGL video background...");

    // Video event handlers for debugging
    const handleVideoLoad = () => {
      console.log("Video loaded successfully");
      setIsLoading(false);
    };

    const handleVideoError = (e: Event) => {
      console.error("Video failed to load:", e);
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener("loadeddata", handleVideoLoad);
    video.addEventListener("error", handleVideoError);

    // Mobile fallback - show video directly without WebGL
    if (isTouchDevice) {
      console.log("Mobile device detected, using native video");
      video.classList.remove("opacity-0");
      video.play().catch((err) => {
        console.log("Auto-play blocked on mobile:", err);
      });
      return;
    }

    // Three.js Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Orthographic camera for fullscreen quad
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    // Video Texture
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTextureRef.current = videoTexture;

    // Shader Material
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

    // Fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Resize handler
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);
    handleResize();

    // Mouse tracking with lerp
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

    // Force play video on interaction (for browsers blocking autoplay)
    const forcePlay = () => {
      video.play().catch(() => {});
      document.removeEventListener("touchstart", forcePlay);
      document.removeEventListener("click", forcePlay);
    };

    if (video.paused) {
      document.addEventListener("touchstart", forcePlay);
      document.addEventListener("click", forcePlay);
    }

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && video.paused) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Animation loop
    const animate = () => {
      if (video.readyState >= 3) {
        videoTexture.needsUpdate = true;
      }

      // Smooth lerp for mouse tracking
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

    // Start animation when video can play
    const handleCanPlay = () => {
      rafIdRef.current = requestAnimationFrame(animate);
    };
    video.addEventListener("canplay", handleCanPlay);

    // Attempt to autoplay
    video.play().catch(() => {
      // Will play on interaction
    });

    // Cleanup
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

      // Dispose Three.js resources
      geometry.dispose();
      material.dispose();
      videoTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // Manual play handler for when autoplay is blocked
  const handleManualPlay = () => {
    const video = videoRef.current;
    if (video) {
      video
        .play()
        .then(() => {
          console.log("Video playing after manual interaction");
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to play video:", err);
        });
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Video Element - Hidden, used as WebGL texture */}
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

      {/* WebGL Canvas - Only rendered on desktop */}
      {!isMobile && (
        <canvas
          ref={canvasRef}
          id="hero-canvas"
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 z-[5] flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error State / Play Button */}
      {(hasError || isLoading) && (
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
            {hasError ? (
              <>
                <p className="text-xl mb-4">Click to play video</p>
                <span className="inline-block px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors">
                  Play Video
                </span>
              </>
            ) : (
              <p className="text-xl">Click anywhere to start</p>
            )}
          </div>
        </button>
      )}

      {/* Your Content Goes Here */}
      <div ref={containerRef} className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Your Headline
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Your subtitle goes here. Move your cursor to see the video
              distortion effect.
            </p>
          </div>
        </section>

        {/* Additional sections */}
        <section className="min-h-screen bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-24">
            <h2 className="text-3xl font-bold text-white mb-8">About</h2>
            <p className="text-white/70 leading-relaxed">
              More content here...
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

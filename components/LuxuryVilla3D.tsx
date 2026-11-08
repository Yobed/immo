'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sun, Sunset, Moon, RotateCcw, Sparkles, X, ChevronRight } from 'lucide-react';

type LightingPreset = 'day' | 'sunset' | 'night';
type CameraAngle = 'overview' | 'pool' | 'interior';

interface ArchitecturalHotspot {
  id: string;
  name: string;
  title: string;
  description: string;
  specs: string;
  position: [number, number, number];
  cameraTarget: { rotY: number; rotX: number; dist: number };
}

const HOTSPOTS: ArchitecturalHotspot[] = [
  {
    id: 'pool',
    name: 'Bassin Miroir 14m',
    title: 'Piscine à Débordement & Solarium',
    description: 'Bassin de 14 mètres avec plage immergée, filtration au sel et régulateur de niveau automatique.',
    specs: 'Profondeur 1,40m • Travertin beige adouci',
    position: [6, 1.2, 7],
    cameraTarget: { rotY: 0.25, rotX: 0.24, dist: 20 },
  },
  {
    id: 'glass',
    name: 'Baies Schüco 3,2m',
    title: 'Menuiseries Aluminium Minimalistes',
    description: 'Double vitrage thermique et acoustique renforcé avec gaz argon, protégeant des chaleurs équatoriales.',
    specs: 'Hauteur sous plafond 3,20m • Verre feuilleté 88.2',
    position: [-5, 3.2, 6.2],
    cameraTarget: { rotY: -0.35, rotX: 0.18, dist: 18 },
  },
  {
    id: 'cantilever',
    name: 'Suite en Porte-à-Faux',
    title: 'Élévation Suspendue & Teck de Côte d\'Ivoire',
    description: 'Master suite parentale suspendue au-dessus du jardin avec claustras brise-soleil en teck massif.',
    specs: 'Portée 4,50m sans poteau • Béton armé banché',
    position: [-1, 6.6, 7.2],
    cameraTarget: { rotY: 0.6, rotX: 0.35, dist: 22 },
  },
];

export default function LuxuryVilla3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [lighting, setLighting] = useState<LightingPreset>('sunset');
  const [angle, setAngle] = useState<CameraAngle>('overview');
  const [isRotating, setIsRotating] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<ArchitecturalHotspot | null>(null);

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const interiorLightsRef = useRef<THREE.PointLight[]>([]);
  const poolLightsRef = useRef<THREE.PointLight[]>([]);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);

  const controlsState = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    targetRotationY: 0.45,
    targetRotationX: 0.35,
    currentRotationY: 0.45,
    currentRotationX: 0.35,
    targetDistance: 32,
    currentDistance: 32,
  });

  const presets = {
    day: {
      bg: 0x0f1115,
      sunColor: 0xfffaed,
      sunIntensity: 2.2,
      sunPos: [20, 30, 20] as [number, number, number],
      ambientColor: 0x3a404d,
      ambientIntensity: 1.2,
      interiorIntensity: 0.4,
      poolGlow: 0.6,
      label: 'Midi Solaire',
    },
    sunset: {
      bg: 0x140e0b,
      sunColor: 0xff8c42,
      sunIntensity: 3.0,
      sunPos: [35, 12, 10] as [number, number, number],
      ambientColor: 0x3d271d,
      ambientIntensity: 0.9,
      interiorIntensity: 1.6,
      poolGlow: 1.4,
      label: 'Golden Hour (18h)',
    },
    night: {
      bg: 0x07080a,
      sunColor: 0x223355,
      sunIntensity: 0.5,
      sunPos: [-15, 25, -20] as [number, number, number],
      ambientColor: 0x111622,
      ambientIntensity: 0.4,
      interiorIntensity: 3.5,
      poolGlow: 2.8,
      label: 'Nuit Privée',
    },
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(presets[lighting].bg);
    scene.fog = new THREE.FogExp2(presets[lighting].bg, 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(24, 18, 28);
    camera.lookAt(0, 3.5, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(presets[lighting].ambientColor, presets[lighting].ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(presets[lighting].sunColor, presets[lighting].sunIntensity);
    sunLight.position.set(...presets[lighting].sunPos);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = 26;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 5. Villa Construction
    const villaGroup = new THREE.Group();

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x161513,
      roughness: 0.85,
      metalness: 0.1,
    });

    const travertineMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6cfc4,
      roughness: 0.35,
      metalness: 0.05,
    });

    const darkBasaltMaterial = new THREE.MeshStandardMaterial({
      color: 0x222120,
      roughness: 0.5,
      metalness: 0.2,
    });

    const teakWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x7c4f32,
      roughness: 0.6,
      metalness: 0.1,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa8c5d9,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      thickness: 0.8,
      specularIntensity: 1,
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x009cb9,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    // 5.1 Base Platform
    const baseGeo = new THREE.BoxGeometry(40, 1.2, 34);
    const baseMesh = new THREE.Mesh(baseGeo, groundMaterial);
    baseMesh.position.y = -0.6;
    baseMesh.receiveShadow = true;
    villaGroup.add(baseMesh);

    // 5.2 Travertine Terrace
    const deckGeo = new THREE.BoxGeometry(32, 0.3, 24);
    const deckMesh = new THREE.Mesh(deckGeo, travertineMaterial);
    deckMesh.position.set(0, 0.15, 2);
    deckMesh.receiveShadow = true;
    villaGroup.add(deckMesh);

    // 5.3 Infinity Edge Pool (14m)
    const poolBorderGeo = new THREE.BoxGeometry(16, 0.8, 8);
    const poolBorderMesh = new THREE.Mesh(poolBorderGeo, darkBasaltMaterial);
    poolBorderMesh.position.set(6, 0.2, 7);
    poolBorderMesh.receiveShadow = true;
    villaGroup.add(poolBorderMesh);

    const waterGeo = new THREE.PlaneGeometry(15.2, 7.2, 32, 32);
    const waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(6, 0.55, 7);
    waterMesh.receiveShadow = true;
    villaGroup.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Underwater Pool Glow
    const poolLight = new THREE.PointLight(0x00f2fe, presets[lighting].poolGlow, 18);
    poolLight.position.set(6, 0.8, 7);
    villaGroup.add(poolLight);
    poolLightsRef.current.push(poolLight);

    // 5.4 Ground Floor Pavilion
    const rdcGeo = new THREE.BoxGeometry(16, 4.2, 12);
    const rdcMesh = new THREE.Mesh(rdcGeo, darkBasaltMaterial);
    rdcMesh.position.set(-5, 2.4, 0);
    rdcMesh.castShadow = true;
    rdcMesh.receiveShadow = true;
    villaGroup.add(rdcMesh);

    const glassRdcGeo = new THREE.BoxGeometry(15.6, 3.8, 0.2);
    const glassRdc = new THREE.Mesh(glassRdcGeo, glassMaterial);
    glassRdc.position.set(-5, 2.3, 6.05);
    villaGroup.add(glassRdc);

    const interiorRdcLight = new THREE.PointLight(0xffb74d, presets[lighting].interiorIntensity, 16);
    interiorRdcLight.position.set(-5, 3.2, 1);
    interiorRdcLight.castShadow = true;
    villaGroup.add(interiorRdcLight);
    interiorLightsRef.current.push(interiorRdcLight);

    // 5.5 Upper Floor Cantilever
    const etageGeo = new THREE.BoxGeometry(20, 3.8, 11);
    const etageMesh = new THREE.Mesh(etageGeo, travertineMaterial);
    etageMesh.position.set(-1, 6.4, 1.5);
    etageMesh.castShadow = true;
    etageMesh.receiveShadow = true;
    villaGroup.add(etageMesh);

    // Teak Brise-soleil
    for (let i = 0; i < 7; i++) {
      const slatGeo = new THREE.BoxGeometry(0.25, 3.4, 3.2);
      const slat = new THREE.Mesh(slatGeo, teakWoodMaterial);
      slat.position.set(8.8, 6.4, -0.8 + i * 0.7);
      slat.castShadow = true;
      villaGroup.add(slat);
    }

    const glassEtageGeo = new THREE.BoxGeometry(12, 3.2, 0.2);
    const glassEtage = new THREE.Mesh(glassEtageGeo, glassMaterial);
    glassEtage.position.set(2, 6.4, 7.05);
    villaGroup.add(glassEtage);

    const interiorEtageLight = new THREE.PointLight(0xffc570, presets[lighting].interiorIntensity, 18);
    interiorEtageLight.position.set(1, 6.8, 2);
    interiorEtageLight.castShadow = true;
    villaGroup.add(interiorEtageLight);
    interiorLightsRef.current.push(interiorEtageLight);

    // Concrete Canopy Roof
    const roofGeo = new THREE.BoxGeometry(22, 0.5, 13);
    const roofMesh = new THREE.Mesh(roofGeo, darkBasaltMaterial);
    roofMesh.position.set(-1, 8.5, 1.5);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    villaGroup.add(roofMesh);

    // Tropical Palms
    const createPalmTree = (x: number, z: number, scale: number = 1) => {
      const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 6 * scale, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d3126, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 3 * scale, z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.castShadow = true;
      villaGroup.add(trunk);

      const crownMat = new THREE.MeshStandardMaterial({ color: 0x1f442b, roughness: 0.7 });
      for (let j = 0; j < 5; j++) {
        const frondGeo = new THREE.ConeGeometry(2.4 * scale, 0.8 * scale, 4);
        const frond = new THREE.Mesh(frondGeo, crownMat);
        frond.position.set(x, 6 * scale, z);
        frond.rotation.x = Math.PI / 4 + (j * Math.PI) / 3;
        frond.rotation.y = (j * Math.PI * 2) / 5;
        frond.castShadow = true;
        villaGroup.add(frond);
      }
    };

    createPalmTree(-16, -4, 1.1);
    createPalmTree(-14, 5, 0.85);
    createPalmTree(17, -6, 1.2);
    createPalmTree(16, 4, 0.95);

    scene.add(villaGroup);

    // 6. User Orbit Controls
    const onMouseDown = (e: MouseEvent) => {
      controlsState.current.isDragging = true;
      controlsState.current.prevMouseX = e.clientX;
      controlsState.current.prevMouseY = e.clientY;
      setIsRotating(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controlsState.current.isDragging) return;
      const deltaX = e.clientX - controlsState.current.prevMouseX;
      const deltaY = e.clientY - controlsState.current.prevMouseY;

      controlsState.current.targetRotationY += deltaX * 0.008;
      controlsState.current.targetRotationX = Math.max(
        0.1,
        Math.min(1.2, controlsState.current.targetRotationX + deltaY * 0.008)
      );

      controlsState.current.prevMouseX = e.clientX;
      controlsState.current.prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      controlsState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsState.current.targetDistance = Math.max(
        16,
        Math.min(50, controlsState.current.targetDistance + e.deltaY * 0.03)
      );
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // 7. Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pool wave oscillation
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = 0.55 + Math.sin(elapsedTime * 2.2) * 0.02;
      }

      // Auto rotation
      if (isRotating) {
        controlsState.current.targetRotationY += 0.0022;
      }

      // Damping
      const cs = controlsState.current;
      cs.currentRotationY += (cs.targetRotationY - cs.currentRotationY) * 0.07;
      cs.currentRotationX += (cs.targetRotationX - cs.currentRotationX) * 0.07;
      cs.currentDistance += (cs.targetDistance - cs.currentDistance) * 0.07;

      const dist = cs.currentDistance;
      const rotY = cs.currentRotationY;
      const rotX = cs.currentRotationX;

      camera.position.x = Math.sin(rotY) * Math.cos(rotX) * dist;
      camera.position.y = Math.sin(rotX) * dist + 2;
      camera.position.z = Math.cos(rotY) * Math.cos(rotX) * dist;
      camera.lookAt(0, 3.8, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // Update lighting smoothly
  useEffect(() => {
    const scene = sceneRef.current;
    const sun = sunLightRef.current;
    const amb = ambientLightRef.current;
    if (!scene || !sun || !amb) return;

    const config = presets[lighting];
    scene.background = new THREE.Color(config.bg);
    if (scene.fog) {
      scene.fog.color = new THREE.Color(config.bg);
    }

    sun.color.setHex(config.sunColor);
    sun.intensity = config.sunIntensity;
    sun.position.set(...config.sunPos);

    amb.color.setHex(config.ambientColor);
    amb.intensity = config.ambientIntensity;

    interiorLightsRef.current.forEach((light) => {
      light.intensity = config.interiorIntensity;
    });

    poolLightsRef.current.forEach((light) => {
      light.intensity = config.poolGlow;
    });
  }, [lighting]);

  // Handle hotspot selection & smooth camera framing
  const handleSelectHotspot = (hotspot: ArchitecturalHotspot) => {
    setActiveHotspot(hotspot);
    setIsRotating(false);

    const cs = controlsState.current;
    cs.targetRotationY = hotspot.cameraTarget.rotY;
    cs.targetRotationX = hotspot.cameraTarget.rotX;
    cs.targetDistance = hotspot.cameraTarget.dist;
  };

  const setCameraPreset = (selectedAngle: CameraAngle) => {
    setAngle(selectedAngle);
    setIsRotating(false);
    setActiveHotspot(null);

    const cs = controlsState.current;
    if (selectedAngle === 'overview') {
      cs.targetRotationY = 0.55;
      cs.targetRotationX = 0.42;
      cs.targetDistance = 34;
    } else if (selectedAngle === 'pool') {
      cs.targetRotationY = 0.2;
      cs.targetRotationX = 0.22;
      cs.targetDistance = 22;
    } else if (selectedAngle === 'interior') {
      cs.targetRotationY = -0.4;
      cs.targetRotationX = 0.18;
      cs.targetDistance = 18;
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#0A0908] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] select-none">
      
      {/* 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-[540px] sm:h-[640px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Top Floating Controls */}
      <div className="absolute top-6 inset-x-6 flex items-start justify-between gap-4 pointer-events-none">
        
        {/* Titre & Statut */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-2xl pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8A97E]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#C8A97E] font-medium">
              Maquette Spatiale 3D WebGL
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-display font-medium text-white tracking-tight mt-0.5">
            Élévation Villa Riviera Golf
          </h3>
        </div>

        {/* Lighting Selector (Pills) */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-1 rounded-2xl flex items-center gap-1 pointer-events-auto shadow-2xl">
          <button
            type="button"
            onClick={() => setLighting('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              lighting === 'day' 
                ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-sm' 
                : 'text-white/60 hover:text-white'
            }`}
            title="Lumière du jour équatoriale"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Midi</span>
          </button>

          <button
            type="button"
            onClick={() => setLighting('sunset')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              lighting === 'sunset' 
                ? 'bg-[#C8A97E]/30 text-[#F5F2EB] border border-[#C8A97E]/50 shadow-sm' 
                : 'text-white/60 hover:text-white'
            }`}
            title="Crépuscule Abidjan (Golden Hour 18h)"
          >
            <Sunset className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span className="hidden sm:inline text-[11px]">Sunset 18h</span>
          </button>

          <button
            type="button"
            onClick={() => setLighting('night')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              lighting === 'night' 
                ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-400/40 shadow-sm' 
                : 'text-white/60 hover:text-white'
            }`}
            title="Éclairage architectural nocturne"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline text-[11px]">Nocturne</span>
          </button>
        </div>

      </div>

      {/* Floating Hotspots Pills (Explore key features) */}
      <div className="absolute top-24 left-6 pointer-events-auto flex flex-col gap-2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">
          Détails d&apos;Architecte
        </span>
        <div className="flex flex-wrap gap-2 max-w-sm">
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleSelectHotspot(spot)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-xl ${
                activeHotspot?.id === spot.id
                  ? 'bg-[#C8A97E] text-[#0A0908] font-bold shadow-lg'
                  : 'bg-black/60 text-white/80 border border-white/10 hover:border-[#C8A97E]/40 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#C8A97E]" />
              <span>{spot.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Hotspot Micro-Card Modal */}
      {activeHotspot && (
        <div className="absolute top-44 left-6 max-w-xs sm:max-w-sm bg-black/80 backdrop-blur-2xl border border-[#C8A97E]/40 rounded-3xl p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)] pointer-events-auto space-y-3 z-30 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8A97E]">
              {activeHotspot.name}
            </span>
            <button
              type="button"
              onClick={() => setActiveHotspot(null)}
              className="text-white/50 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-base font-display font-medium text-white leading-tight">
            {activeHotspot.title}
          </h4>

          <p className="text-xs text-white/70 font-light leading-relaxed">
            {activeHotspot.description}
          </p>

          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-[#C8A97E]">
            {activeHotspot.specs}
          </div>
        </div>
      )}

      {/* Bottom Floating Bar : Angles de vue & Tourbillon */}
      <div className="absolute bottom-6 inset-x-6 flex items-center justify-between pointer-events-none">
        
        {/* Angles de Caméra */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-1 rounded-2xl flex items-center gap-1 pointer-events-auto shadow-2xl">
          <button
            type="button"
            onClick={() => setCameraPreset('overview')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              angle === 'overview'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Vue Drone
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('pool')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              angle === 'pool'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Piscine Miroir
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('interior')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              angle === 'interior'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Volumes Salon
          </button>
        </div>

        {/* Bouton Rotation Automatique / Pause */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl pointer-events-auto shadow-2xl flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isRotating ? 'bg-[#C8A97E]/20 text-[#C8A97E] border border-[#C8A97E]/30' : 'text-white/60 hover:text-white'
            }`}
            title={isRotating ? 'Mettre en pause la rotation 3D' : 'Lancer la rotation 3D'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">{isRotating ? 'Auto Orbit' : 'Interagir'}</span>
          </button>
        </div>

      </div>

      {/* Guide minimaliste au survol */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 text-[10px] font-mono uppercase tracking-widest text-white/50 text-center">
        Faites glisser pour faire pivoter à 360° • Molette pour zoomer
      </div>

    </div>
  );
}

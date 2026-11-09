'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import type { Property } from '@/lib/types';

type Props = {
  properties: Property[];
  /** Appelé quand le bien face à la caméra change. */
  onFrontChange?: (property: Property) => void;
};

const RADIUS = 9;
const HEIGHT = 5.2;
const GAP = 0.14; // part de l'arc laissée vide entre deux photos
const AUTO_SPEED = 0.05; // rad/s
const SCROLL_FACTOR = 0.0016;
const DRAG_FACTOR = 0.005;

const VERTEX = /* glsl */ `
  uniform float uBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // les photos se bombent selon la vitesse de rotation
    p.y *= 1.0 + sin(uv.x * 3.14159) * uBend;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uCover;   // facteur "object-fit: cover"
  uniform float uLight;  // 1 face caméra, plus sombre sur les côtés
  uniform float uReady;
  varying vec2 vUv;
  void main() {
    vec2 uv = vec2(1.0 - vUv.x, vUv.y);          // vue de l'intérieur : on corrige le miroir
    uv = (uv - 0.5) * uCover + 0.5;
    vec3 color = texture2D(uMap, uv).rgb;
    color = mix(vec3(0.07), color, uReady);
    gl_FragColor = vec4(color * uLight, 1.0);
  }
`;

export default function HeroGallery3D({ properties, onFrontChange }: Props) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef(onFrontChange);
  const [isDragging, setIsDragging] = useState(false);

  frontRef.current = onFrontChange;
  const key = properties.map((p) => p.id).join('|');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || properties.length === 0) return;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 0);

    const ring = new THREE.Group();
    scene.add(ring);

    const segment = (Math.PI * 2) / properties.length;
    const arc = segment * (1 - GAP);
    const panelAspect = (RADIUS * arc) / HEIGHT;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const materials: THREE.ShaderMaterial[] = [];
    const meshes: THREE.Mesh[] = [];

    properties.forEach((property, i) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        side: THREE.BackSide,
        uniforms: {
          uMap: { value: null },
          uCover: { value: new THREE.Vector2(1, 1) },
          uLight: { value: 1 },
          uBend: { value: 0 },
          uReady: { value: 0 },
        },
      });
      loader.load(property.images[0], (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const img = texture.image as HTMLImageElement;
        const imageAspect = img.width / img.height;
        material.uniforms.uMap.value = texture;
        material.uniforms.uCover.value =
          imageAspect > panelAspect ? new THREE.Vector2(panelAspect / imageAspect, 1) : new THREE.Vector2(1, imageAspect / panelAspect);
        material.uniforms.uReady.value = 1;
      });
      // Le bien i est face à la caméra quand ring.rotation.y = i * segment
      const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, 48, 1, true, -i * segment - arc / 2 + Math.PI, arc);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.index = i;
      ring.add(mesh);
      materials.push(material);
      meshes.push(mesh);
    });

    /* ---- Interaction ---- */
    let target = 0;
    let current = 0;
    let lastScroll = window.scrollY;
    let dragX: number | null = null;
    let dragDistance = 0;
    let front = -1;

    const onScroll = () => {
      target += (window.scrollY - lastScroll) * SCROLL_FACTOR;
      lastScroll = window.scrollY;
    };
    const onPointerDown = (e: PointerEvent) => {
      dragX = e.clientX;
      dragDistance = 0;
      setIsDragging(true);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      dragDistance += Math.abs(dx);
      target -= dx * DRAG_FACTOR;
      dragX = e.clientX;
    };
    const onPointerUp = (e: PointerEvent) => {
      const wasClick = dragX !== null && dragDistance < 6;
      dragX = null;
      setIsDragging(false);
      if (!wasClick) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (hit) router.push(`/biens/${properties[hit.object.userData.index as number].id}`);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // sur mobile on élargit le champ pour garder la photo lisible
      camera.fov = w < 640 ? 70 : 52;
      // caméra un peu basse : les photos remontent et laissent la place au titre en bas
      camera.position.y = w < 640 ? -1.8 : -0.6;
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize);

    /* ---- Boucle ---- */
    const clock = new THREE.Clock();
    let frame = 0;
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; });
    observer.observe(mount);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!isVisible) return;
      if (!isReduced && dragX === null) target += AUTO_SPEED * dt;
      const previous = current;
      current += (target - current) * 0.07;
      const velocity = (current - previous) / Math.max(dt, 0.001);
      ring.rotation.y = current;

      const bend = isReduced ? 0 : THREE.MathUtils.clamp(velocity * 0.06, -0.12, 0.12);
      materials.forEach((m, i) => {
        m.uniforms.uBend.value += (bend - m.uniforms.uBend.value) * 0.1;
        // distance angulaire entre la photo i et l'avant de la scène
        const diff = Math.atan2(Math.sin(current - i * segment), Math.cos(current - i * segment));
        m.uniforms.uLight.value = THREE.MathUtils.mapLinear(Math.min(Math.abs(diff), 1.6), 0, 1.6, 1, 0.35);
      });

      const nearest = ((Math.round(current / segment) % properties.length) + properties.length) % properties.length;
      if (nearest !== front) {
        front = nearest;
        frontRef.current?.(properties[nearest]);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      meshes.forEach((m) => m.geometry.dispose());
      materials.forEach((m) => {
        (m.uniforms.uMap.value as THREE.Texture | null)?.dispose();
        m.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // ponytail: la scène se reconstruit seulement si la liste des biens change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, router]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      aria-label="Galerie 3D des biens : glissez pour tourner, cliquez sur une photo pour l'ouvrir"
      role="img"
    />
  );
}

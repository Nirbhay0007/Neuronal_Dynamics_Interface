import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { HHState, HHParameters } from '../types';

interface NeuronSceneProps {
  state: HHState;
  simulationParams: HHParameters;
}

const NeuronScene: React.FC<NeuronSceneProps> = ({ state, simulationParams }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Materials refs to update uniforms
  const neuronMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const ionMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  
  // Ref to store state for the animation loop to access latest value without re-binding
  const stateRef = useRef(state);
  const paramsRef = useRef(simulationParams);

  useEffect(() => {
    stateRef.current = state;
    paramsRef.current = simulationParams;
  }, [state, simulationParams]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup Scene ---
    const scene = new THREE.Scene();
    // Reduce fog density to ensure distant branches are more visible
    scene.fog = new THREE.FogExp2(0x050505, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.z = 8;
    camera.position.y = 1;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Create Neuron Geometry (Fractal) ---
    const createBranch = (start: THREE.Vector3, direction: THREE.Vector3, length: number, radius: number, depth: number, positions: number[]) => {
      if (depth === 0) return;

      const end = new THREE.Vector3().copy(start).add(direction.clone().multiplyScalar(length));
      
      positions.push(start.x, start.y, start.z);
      positions.push(end.x, end.y, end.z);
      
      // Branch out
      const numBranches = 2;
      for (let i = 0; i < numBranches; i++) {
        const spread = 0.8;
        const newDir = direction.clone().applyEuler(new THREE.Euler(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        )).normalize();
        
        createBranch(end, newDir, length * 0.7, radius * 0.6, depth - 1, positions);
      }
    };

    const neuronPositions: number[] = [];
    
    // Create multiple main dendrites
    const roots = 6;
    for (let i = 0; i < roots; i++) {
        const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
        createBranch(new THREE.Vector3(0,0,0), dir, 2.5, 0.1, 5, neuronPositions);
    }
    
    const neuronGeometry = new THREE.BufferGeometry();
    neuronGeometry.setAttribute('position', new THREE.Float32BufferAttribute(neuronPositions, 3));

    // --- Neuron Shader Material ---
    const neuronShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        voltage: { value: -65 },
        // Updated colors to be much brighter/neon for visibility
        colorRest: { value: new THREE.Color(0x0066ff) }, // Bright Electric Blue
        colorActive: { value: new THREE.Color(0xff00ff) }, // Neon Magenta
        colorPeak: { value: new THREE.Color(0xffffff) }, // White
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float voltage;
        uniform vec3 colorRest;
        uniform vec3 colorActive;
        uniform vec3 colorPeak;
        uniform float time;
        varying vec3 vPos;
        
        void main() {
          // Normalize voltage: -90mV to +50mV
          float normV = smoothstep(-90.0, 50.0, voltage);
          
          // Color Interpolation
          // Mix faster to active color to show change early
          vec3 color = mix(colorRest, colorActive, smoothstep(0.1, 0.8, normV));
          color = mix(color, colorPeak, smoothstep(0.8, 1.0, normV));

          // 1. Heartbeat Pulse (Global)
          // Always pulsing slightly (alive), gets frantic with voltage
          float pulseSpeed = 2.0 + (normV * 15.0); 
          float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
          
          // 2. Conduction Wave (Spatial)
          // Travels outward
          float dist = length(vPos);
          float flowSpeed = 3.0 + (normV * 12.0);
          float wave = sin(dist * 2.0 - time * flowSpeed);
          
          // Sharpen the wave to look like electric signals
          float waveSharp = pow(max(0.0, wave), 3.0); 
          
          // Intensity Calculation
          // BOOSTED BASE INTENSITY so it's always visible
          float baseIntensity = 1.5; 
          
          // Pulse modulates the base glow
          float pulseEffect = pulse * 0.5;
          
          // Wave adds bright streaks
          float waveEffect = waveSharp * (2.0 + normV * 5.0);
          
          float totalIntensity = baseIntensity + pulseEffect + waveEffect;
          
          // Massive Overdrive at Peak (Action Potential)
          if (normV > 0.85) {
             totalIntensity += 8.0 * (normV - 0.85); // Flash white
          }

          // Output
          // Alpha 1.0 ensures max visibility with AdditiveBlending
          gl_FragColor = vec4(color * totalIntensity, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      linewidth: 2, // Hint for thicker lines where supported
    });
    
    neuronMaterialRef.current = neuronShaderMaterial;

    const lines = new THREE.LineSegments(neuronGeometry, neuronShaderMaterial);
    scene.add(lines);

    // --- ION FLUX PARTICLE SYSTEM WITH TRAILS ---
    const PARTICLE_COUNT = 1500; 
    const TRAIL_LENGTH = 12; 
    
    const ionGeo = new THREE.BufferGeometry();
    const ionPos: number[] = [];
    const ionDir: number[] = [];
    const ionType: number[] = []; // 0 = Na, 1 = K
    const ionRandom: number[] = [];
    const ionTrailIdx: number[] = []; // 0.0 (head) -> 1.0 (tail)

    // Sample points along the neuron segments
    for(let i=0; i<PARTICLE_COUNT; i++) {
        // Pick a random line segment
        const segIndex = Math.floor(Math.random() * (neuronPositions.length / 6));
        const idx = segIndex * 6;
        
        const p1 = new THREE.Vector3(neuronPositions[idx], neuronPositions[idx+1], neuronPositions[idx+2]);
        const p2 = new THREE.Vector3(neuronPositions[idx+3], neuronPositions[idx+4], neuronPositions[idx+5]);
        
        const t = Math.random();
        const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
        
        // Random direction (approx normal)
        const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();

        const type = Math.random() > 0.5 ? 1 : 0;
        const rnd = Math.random();

        // Create trail vertices for this single particle
        for (let j = 0; j < TRAIL_LENGTH; j++) {
            ionPos.push(pos.x, pos.y, pos.z);
            ionDir.push(dir.x, dir.y, dir.z);
            ionType.push(type);
            ionRandom.push(rnd);
            // Normalized index: 0 is head, 1 is tail
            ionTrailIdx.push(j / (TRAIL_LENGTH - 1));
        }
    }

    ionGeo.setAttribute('position', new THREE.Float32BufferAttribute(ionPos, 3));
    ionGeo.setAttribute('direction', new THREE.Float32BufferAttribute(ionDir, 3));
    ionGeo.setAttribute('ionType', new THREE.Float32BufferAttribute(ionType, 1));
    ionGeo.setAttribute('random', new THREE.Float32BufferAttribute(ionRandom, 1));
    ionGeo.setAttribute('trailIdx', new THREE.Float32BufferAttribute(ionTrailIdx, 1));

    const ionShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uNa: { value: 0 }, // Sodium conductance/flow
        uK: { value: 0 },  // Potassium conductance/flow
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float time;
        uniform float uNa;
        uniform float uK;
        uniform float pixelRatio;
        
        attribute float ionType;
        attribute float random;
        attribute vec3 direction;
        attribute float trailIdx; // 0.0 (head) to 1.0 (tail)
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vType;
        
        void main() {
          vec3 pos = position;
          vType = ionType;
          float activity = 0.0;
          
          // --- Na+ (Sodium) Logic ---
          if (ionType < 0.5) {
            activity = uNa;
            
            // Dynamic Trail: Stretches with activity
            // Base lag 0.04, expands significantly under load
            float lagBase = 0.04 + (uNa * 0.08);
            float lag = trailIdx * lagBase; 
            
            float localTime = time - lag;
            
            // Jitter increases with activity for "electric" look
            float jitterFreq = 20.0 + (uNa * 30.0);
            float jitterAmp = 0.1 + (uNa * 0.2);
            
            // High frequency vibration 
            vec3 jitter = direction * sin(localTime * jitterFreq + random * 100.0) * jitterAmp;
            pos += jitter;
            
            vColor = vec3(0.1, 1.0, 1.0); // Bright Electric Cyan
            
            // Alpha: Head is opaque, tail fades
            // Smoothstep ensures they only appear when channel is open
            vAlpha = smoothstep(0.05, 1.0, activity) * (1.0 - pow(trailIdx, 0.7));
            
            // Size Modulation
            float sizeBase = 4.0;
            float sizeMod = (1.0 + uNa * 2.0); // Grows with flow
            float sizeTrail = (1.0 - trailIdx * 0.5); // Tapers
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = sizeBase * sizeMod * sizeTrail * (8.0 / -mvPosition.z) * pixelRatio;
            
          } 
          // --- K+ (Potassium) Logic ---
          else {
            activity = uK;
            
            // Dynamic Trail: Flow speed and trail length
            float driftBase = 1.0 + (uK * 2.0);
            float lagBase = 0.2 + (uK * 0.2); // Trails get longer and lazier
            
            float lag = trailIdx * lagBase;
            float localTime = time - lag;
            
            // Smooth drifting motion
            float cycle = mod(localTime * driftBase + random * 10.0, 1.0);
            
            // Spiral/Drift effect away from neuron
            vec3 offset = direction * (cycle * 3.0);
            // Add slight spiral twist to the trail
            offset += cross(direction, vec3(0,1,0)) * sin(localTime * 2.0) * 0.2 * trailIdx;
            
            pos += offset;
            
            vColor = vec3(0.8, 0.2, 1.0); // Purple/Magenta
            
            // Alpha Fade
            vAlpha = smoothstep(0.05, 1.0, activity) * (1.0 - cycle) * (1.0 - trailIdx); 
            
            float sizeBase = 5.0;
            float sizeMod = (1.0 + uK * 0.5);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = sizeBase * sizeMod * (1.0 - trailIdx * 0.4) * (8.0 / -mvPosition.z) * pixelRatio;
          }
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vType;
        
        void main() {
          if (vAlpha < 0.01) discard;
          
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          // Procedural Texture Generation
          float glow = 0.0;
          
          if (vType < 0.5) { // Na+ : Sharp, electric spark
             // Sharp core
             glow = 1.0 - (dist * 2.0);
             glow = pow(glow, 3.0);
             
             // Horizontal flare artifact for "cinematic" look
             float flare = max(0.0, 1.0 - abs(coord.y * 8.0));
             glow += flare * 0.6;
             
             // Slight vertical flare
             float vFlare = max(0.0, 1.0 - abs(coord.x * 12.0));
             glow += vFlare * 0.3;
             
          } else { // K+ : Soft, gaseous orb
             // Soft diffusion
             glow = 1.0 - (dist * 2.0);
             glow = pow(glow, 1.5);
          }
          
          gl_FragColor = vec4(vColor, vAlpha * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    ionMaterialRef.current = ionShaderMaterial;
    const ionPoints = new THREE.Points(ionGeo, ionShaderMaterial);
    scene.add(ionPoints);


    // --- Soma Mesh (Sphere) ---
    const somaGeo = new THREE.IcosahedronGeometry(0.5, 2);
    const somaMat = new THREE.MeshBasicMaterial({ 
        color: 0x00f3ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const soma = new THREE.Mesh(somaGeo, somaMat);
    scene.add(soma);

    // --- Background Particles ---
    const partGeo = new THREE.BufferGeometry();
    const partPos = [];
    for(let i=0; i<500; i++) {
        partPos.push((Math.random()-0.5)*30);
        partPos.push((Math.random()-0.5)*30);
        partPos.push((Math.random()-0.5)*30);
    }
    partGeo.setAttribute('position', new THREE.Float32BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
        color: 0x444466,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(partGeo, partMat);
    particlesRef.current = stars;
    scene.add(stars);


    // --- Handle Resize ---
    const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
        
        // Update pixel ratio uniform in case of monitor move/zoom
        if (ionMaterialRef.current) {
            ionMaterialRef.current.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
    };
    window.addEventListener('resize', handleResize);
    // Force initial resize to ensure canvas has size
    handleResize();

    // --- Animation Loop ---
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentParams = stateRef.current;
      const simParams = paramsRef.current; // Access current simulation parameters (conductance)

      // Update neuron shader uniforms
      if (neuronMaterialRef.current) {
        neuronMaterialRef.current.uniforms.time.value = time;
        neuronMaterialRef.current.uniforms.voltage.value = currentParams.V;
      }

      // Update ion shader uniforms
      if (ionMaterialRef.current) {
        ionMaterialRef.current.uniforms.time.value = time;
        
        // VISUALIZATION LOGIC:
        const gNaFactor = simParams.g_Na / 120.0;
        const gKFactor = simParams.g_K / 36.0;

        // I_Na ~ m^3 * h * g_Na
        const naFlow = Math.pow(currentParams.m, 3) * currentParams.h * gNaFactor;
        // I_K ~ n^4 * g_K
        const kFlow = Math.pow(currentParams.n, 4) * gKFactor;
        
        // Pass these scaled values to the shader
        ionMaterialRef.current.uniforms.uNa.value = naFlow * 12.0; 
        ionMaterialRef.current.uniforms.uK.value = kFlow * 12.0;
      }

      // Rotate Neuron
      lines.rotation.y = time * 0.05;
      lines.rotation.x = Math.sin(time * 0.1) * 0.1;
      soma.rotation.y = -time * 0.1;
      ionPoints.rotation.y = lines.rotation.y;
      ionPoints.rotation.x = lines.rotation.x;

      // Pulse Soma
      const v = currentParams.V;
      const scale = 1 + Math.max(0, (v + 50) * 0.01); 
      soma.scale.setScalar(scale);
      
      if (v > 0) {
          somaMat.color.setHex(0xffffff);
      } else if (v > -55) {
          somaMat.color.setHex(0xbc13fe);
      } else {
          somaMat.color.setHex(0x00f3ff);
      }

      // Rotate stars
      if (particlesRef.current) {
          particlesRef.current.rotation.y = time * 0.01;
      }

      // --- Cinematic Camera Orbit ---
      if (cameraRef.current) {
        const radius = 9;
        const orbitSpeed = 0.10; // Slowed down from 0.15 for more "cinematic" feel
        // Circular orbit
        cameraRef.current.position.x = Math.sin(time * orbitSpeed) * radius;
        cameraRef.current.position.z = Math.cos(time * orbitSpeed) * radius;
        // Gentle vertical bobbing
        cameraRef.current.position.y = Math.sin(time * 0.07) * 1.5 + 0.5;
        cameraRef.current.lookAt(0, 0, 0);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />;
};

export default NeuronScene;
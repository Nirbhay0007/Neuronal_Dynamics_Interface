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
    scene.fog = new THREE.FogExp2(0x050505, 0.02);
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
        colorRest: { value: new THREE.Color(0x001133) }, // Dark Blue
        colorActive: { value: new THREE.Color(0xbc13fe) }, // Purple/Magenta
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
          // Normalize voltage: Hyperpolarization(-120) -> 0.0, Peak(+60) -> 1.0
          // Range is 180mV to accommodate strong hyperpolarization undershoot
          float normV = clamp((voltage + 120.0) / 180.0, 0.0, 1.0);
          
          vec3 color;
          
          if (normV < 0.35) {
             color = mix(colorRest * 0.3, colorRest, normV * 2.85); 
          } else if (normV < 0.8) {
             color = mix(colorRest, colorActive, (normV - 0.35) * 2.2);
          } else {
             color = mix(colorActive, colorPeak, (normV - 0.8) * 5.0);
          }

          // Pulse wave effect
          float dist = length(vPos);
          float wave = sin(dist * 2.0 - time * 5.0 * (0.5 + normV)); 
          
          float intensity = 0.5 + wave * 0.5;
          
          // Enhanced Bloom Logic for High Voltage
          if (normV > 0.83) { // Approx > +30mV
             // Simulating "Bloom" by overdriving intensity and whitening
             intensity = 4.0 + wave; 
             color += vec3(0.3, 0.8, 1.0); // Add cyan-white tint
          } else if (normV > 0.6) {
             intensity += 1.5; // Glow harder on spike rise
          }

          gl_FragColor = vec4(color * intensity, 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
    
    neuronMaterialRef.current = neuronShaderMaterial;

    const lines = new THREE.LineSegments(neuronGeometry, neuronShaderMaterial);
    scene.add(lines);

    // --- ION FLUX PARTICLE SYSTEM WITH TRAILS ---
    // Instead of 1 vertex per particle, we create N vertices per particle to form a trail.
    // The shader will offset these vertices in time ("ghosting").
    
    const particleCount = 1500; 
    const trailLength = 8; // Number of segments in the trail
    
    const ionGeo = new THREE.BufferGeometry();
    const ionPos: number[] = [];
    const ionDir: number[] = [];
    const ionType: number[] = []; // 0 = Na, 1 = K
    const ionRandom: number[] = [];
    const ionTrailIdx: number[] = []; // 0.0 (head) -> 1.0 (tail)

    // Sample points along the neuron segments
    for(let i=0; i<particleCount; i++) {
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
        for (let j = 0; j < trailLength; j++) {
            ionPos.push(pos.x, pos.y, pos.z);
            ionDir.push(dir.x, dir.y, dir.z);
            ionType.push(type);
            ionRandom.push(rnd);
            // Normalized index: 0 is head, 1 is tail
            ionTrailIdx.push(j / (trailLength - 1));
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
      },
      vertexShader: `
        uniform float time;
        uniform float uNa;
        uniform float uK;
        
        attribute float ionType;
        attribute float random;
        attribute vec3 direction;
        attribute float trailIdx; // 0.0 to 1.0
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          float activity = 0.0;
          float sizeScale = 1.0;
          
          // --- Trail Logic ---
          // We calculate a 'localTime' for each trail segment.
          // The tail segments are 'lagging' behind in time.
          float localTime = time;
          
          if (ionType < 0.5) {
            // Sodium (Na+) - Influx / Spiky
            activity = uNa;
            
            // Short lag for jittery spark effect
            float lag = trailIdx * 0.05; 
            localTime = time - lag;
            
            // Jittery movement
            float jitter = sin(localTime * 20.0 + random * 100.0) * 0.1;
            pos += direction * jitter * (1.0 + uNa * 0.1); 
            
            vColor = vec3(0.0, 0.95, 1.0); // Cyan
            
            // Fade tail alpha
            vAlpha = smoothstep(0.05, 0.8, activity) * 0.8 * (1.0 - trailIdx); 
            
            sizeScale = 1.0 + uNa * 0.05;
            float pSize = 4.0 * (1.0 + jitter * 5.0) * sizeScale * (1.0 - trailIdx * 0.5);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Perspective Size Attenuation
            gl_PointSize = pSize * (8.0 / -mvPosition.z);
            
          } else {
            // Potassium (K+) - Efflux / Drifting
            activity = uK;
            
            // Longer lag for smooth flow trails
            float lag = trailIdx * 0.2;
            localTime = time - lag;
            
            float driftSpeed = 1.5 + uK * 0.01; // Faster drift in overdrive
            float cycle = mod(localTime * driftSpeed + random * 10.0, 1.0);
            
            pos += direction * (cycle * 2.0); // Drift out
            
            vColor = vec3(0.74, 0.07, 1.0); // Purple
            
            // Fade Alpha
            vAlpha = smoothstep(0.05, 0.8, activity) * (1.0 - cycle) * (1.0 - trailIdx); 
            
            sizeScale = 1.0 + uK * 0.05;
            float pSize = 6.0 * (1.0 - cycle * 0.5) * sizeScale * (1.0 - trailIdx * 0.3);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Perspective Size Attenuation
            gl_PointSize = pSize * (8.0 / -mvPosition.z);
          }
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          if (vAlpha < 0.01) discard;
          
          // Soft circular particle
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          float glow = 1.0 - (dist * 2.0);
          glow = pow(glow, 1.5);
          
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
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, SoftShadows, Text } from "@react-three/drei";
import * as THREE from "three";

// --- 1. ASSET COMPONENTS (Darker colors for contrast) ---

const Building = ({ position, color }) => {
    const group = useRef();
    useFrame((state) => {
        if (group.current) {
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.02;
        }
    });

    return (
        <group ref={group} position={position}>
            {/* Base - Slightly Grey for contrast */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial color="#eeeeee" />
            </mesh>
            {/* Roof Awning - Vibrant Color */}
            <mesh position={[0, 1.6, 0.4]}>
                <boxGeometry args={[1.6, 0.2, 0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Glass Window - Blue Pop */}
            <mesh position={[0, 0.6, 0.76]}>
                <planeGeometry args={[1, 0.8]} />
                <meshStandardMaterial color="#55aaff" emissive="#004488" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
};

const Tree = ({ position }) => {
    return (
        <group position={position}>
            {/* Trunk - Dark Brown */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
            {/* Leaves - Deep Green */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <coneGeometry args={[0.6, 1.4, 8]} />
                <meshStandardMaterial color="#4CAF50" />
            </mesh>
        </group>
    );
};

const StreetLight = ({ position }) => {
    return (
        <group position={position}>
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, 2, 0.3]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

const GlowingPath = () => {
    const curve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4, 0, 4),
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(4, 0, -4),
    ]), []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <tubeGeometry args={[curve, 64, 0.3, 8, false]} />
            <meshStandardMaterial color="#FF7F50" emissive="#FF7F50" emissiveIntensity={1.5} />
        </mesh>
    );
};

// --- DYNAMIC COMPONENTS (Restored) ---

const Walker = () => {
    const ref = useRef();
    const rippleRef = useRef();

    // Path definition
    const curve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4, 0, 4),
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(4, 0, -4),
    ]), []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const loopTime = 10;
        const tNormalized = (t % loopTime) / loopTime;

        // Move along path
        if (ref.current) {
            const position = curve.getPoint(tNormalized);
            ref.current.position.copy(position);
            ref.current.position.y = 0.5 + Math.abs(Math.sin(t * 8)) * 0.1; // Bobbing

            // Look forward
            const lookAtPoint = curve.getPoint(Math.min(tNormalized + 0.01, 1));
            ref.current.lookAt(lookAtPoint);
        }

        // Ripple Animation
        if (rippleRef.current) {
            const rippleScale = (t * 2) % 3;
            rippleRef.current.scale.set(rippleScale, rippleScale, rippleScale);
            rippleRef.current.material.opacity = Math.max(0, 1 - rippleScale / 3);
        }
    });

    return (
        <group ref={ref}>
            <mesh position={[0, 0.8, 0]} castShadow>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
                <coneGeometry args={[0.4, 0.8, 32]} />
                <meshStandardMaterial color="#FF7F50" />
            </mesh>

            {/* Radar Ripple */}
            <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                <ringGeometry args={[0.4, 0.6, 32]} />
                <meshBasicMaterial color="#FF7F50" transparent opacity={0.5} />
            </mesh>
        </group>
    )
}

const GhostShopper = ({ start, end, speed = 0.5, delay = 0 }) => {
    const ref = useRef();
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime() + delay;
        // Ping pong movement 0 -> 1 -> 0
        const alpha = (Math.sin(t * speed) + 1) / 2; // Normalize to 0-1

        if (ref.current) {
            ref.current.position.lerpVectors(startVec, endVec, alpha);
        }
    });

    return (
        <mesh ref={ref} position={start}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fca5a5" transparent opacity={0.6} emissive="#fca5a5" emissiveIntensity={0.5} />
        </mesh>
    )
}

const StreetName = ({ position, text, rotation = [-Math.PI / 2, 0, 0] }) => {
    return (
        <Text
            position={position}
            rotation={rotation}
            fontSize={0.4}
            color="#475569" // Slate 600
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
            {text}
        </Text>
    );
};

// --- 2. SCENE COMPONENT ---

export default function IsometricMap() {
    return (
        <div style={{ width: "100%", height: "500px", borderRadius: "24px", overflow: "hidden", background: "#fff7ed" }}>
            <Canvas shadows dpr={[1, 2]}>

                {/* FIX 1: FOG DISTANCE - Pushed back so it doesn't hide the city */}
                <color attach="background" args={['#fff7ed']} />
                <fog attach="fog" args={['#fff7ed', 50, 150]} />

                {/* LIGHTING - Increased Shadow Contrast */}
                <ambientLight intensity={0.7} />
                <directionalLight
                    position={[10, 20, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={1024}
                />
                {/* Soft shadows make it look realistic, not harsh */}
                <SoftShadows size={15} samples={10} focus={0.5} />

                {/* CAMERA - Zoomed out slightly to see everything */}
                <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={35} near={-50} far={200} />
                <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 3} />

                <group position={[0, -1, 0]}>
                    {/* GROUND PLANE */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#fff7ed" />
                    </mesh>
                    {/* GRID - Made subtler */}
                    <gridHelper args={[60, 60, '#cbd5e1', '#e2e8f0']} position={[0, 0.01, 0]} />

                    <GlowingPath />

                    {/* SHOPS */}
                    <Building position={[-4, 0, 5]} color="#FF5252" /> {/* Red */}
                    <Building position={[-2, 0, -2]} color="#2196F3" /> {/* Blue */}
                    <Building position={[4, 0, -5]} color="#FFC107" />  {/* Yellow */}

                    {/* DECORATIONS */}
                    <Tree position={[-2, 0, 3]} />
                    <Tree position={[-5, 0, 2]} />
                    <Tree position={[3, 0, -2]} />
                    <Tree position={[5, 0, -2]} />
                    <StreetLight position={[-1, 0, 1]} />
                    <StreetLight position={[1, 0, -1]} />

                    {/* DYNAMIC ELEMENTS (Restored) */}
                    <Walker />

                    <GhostShopper start={[-4, 0, 4]} end={[-2, 0, 2]} speed={0.8} delay={0} />
                    <GhostShopper start={[-2, 0, -2]} end={[2, 0, -2]} speed={0.6} delay={1.5} />
                    <GhostShopper start={[4, 0, -5]} end={[2, 0, -2]} speed={0.7} delay={2.5} />
                    <GhostShopper start={[-3, 0, 1]} end={[-1, 0, -3]} speed={0.4} delay={0.5} />

                    <StreetName position={[-2.5, 0.02, 1.5]} text="Main St" rotation={[-Math.PI / 2, 0, 0.5]} />
                    <StreetName position={[2, 0.02, -1]} text="Market Rd" rotation={[-Math.PI / 2, 0, -0.2]} />

                </group>
            </Canvas>
        </div>
    );
}

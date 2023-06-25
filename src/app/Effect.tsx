'use client';
import { Suspense, useEffect, useState } from 'react'
import { Sphere, OrbitControls, Box, useTexture, Environment,OrthographicCamera  } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { a as a3, useSpring as useSpringThree } from '@react-spring/three'
import * as THREE from 'three'
import { useControls } from 'leva'
import Image from 'next/image'

const options = [
  [0, 100, 50],
  [60, 100, 50],
  [150, 100, 50],              
  [240, 70, 60],
  [0, 0, 80],
  [240,100,50]
]


export default function Effect() {
    const [step, setStep] = useState(0)


    const { roughness } = useControls('texture',{
        roughness: {
          value: 0.15,
          min: 0,
          max: 1,
          step: 0.01,
        },
    })

    return (
      <div style={{ background: 'transparent', width: '100%', height: '100%' }}>
        <Canvas style={{
        }}>
          <Suspense fallback={null}>
            <OrbitControls enableRotate={true} enablePan={true} enableZoom={true} />
            <Marble step={step} setStep={setStep} roughness={roughness}/>
            <Environment files="./assets/warehouse.hdr" />
          </Suspense>
            <OrthographicCamera makeDefault={true} position={[0,0,50]}  near={0.1} far={2000} zoom={100} />
        </Canvas>
      </div> 
    )
  }

interface MarbleProps {
    step: number
    setStep: any
    roughness:number
}

const Marble = ({ step, setStep,roughness }:MarbleProps) => {
    const [hover, setHover] = useState(false)
    const [tap, setTap] = useState(false)
    

    const { friction,tension } = useControls('animation',{
      friction: {
        value: 15,
        min: 0,
        max: 100,
        step: 0.01,
      },
      tension: {
        value: 300,
        min: 0,
        max: 1000,
        step: 0.01,
      },
    })

    const { position,scale } = useControls('geometry',{
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
      scale: {
        value:1,
        min: 0,
        max: 10,
        step: 0.01,
      }
    })
    const { animationScale } = useSpringThree({
      animationScale: tap && hover ? scale-0.05 : scale,
      config: {
        friction: friction,
        tension: tension,
      },
    })
    
    useEffect(() => {
      document.body.style.cursor = hover ? 'pointer' : 'auto'
    }, [hover])



    return (
      <group position={[position.x,position.y,position.z]}>
        <a3.group scale={animationScale} 
          onPointerEnter={() => setHover(true)} 
          onPointerOut={() => setHover(false)} 
          onClick={() => setStep(step + 1)}
        >
          <Sphere args={[1, 64, 32]}>
            <MagicMarbleMaterial step={step} roughness={roughness} />
          </Sphere>
        </a3.group>
        {/* This big invisible box is just a pointer target so we can reliably track if the mouse button is up or down */}
        <Box args={[100, 100, 100]} onPointerDown={() => setTap(true)} onPointerUp={() => setTap(false)}>
          <meshBasicMaterial side={THREE.BackSide} visible={false} />
        </Box>
      </group>
    )
  }


const sNoiseFuncs=`            /**
* @param p - Point to displace
* @param strength - How much the map can displace the point
* @returns Point with scrolling displacement applied
*/

 vec3 mod289(vec3 x) {
   return x - floor(x * (1.0 / 289.0)) * 289.0;
 }
 
 vec2 mod289(vec2 x) {
   return x - floor(x * (1.0 / 289.0)) * 289.0;
 }
 
 vec3 permute(vec3 x) {
   return mod289(((x*34.0)+1.0)*x);
 }

#define noiseFactor 0.2

float snoise(vec2 v)
 {
 const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                     0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                     0.024390243902439); // 1.0 / 41.0
// First corner
 vec2 i  = floor(v + dot(v, C.yy) );
 vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
 vec2 i1;
 //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
 //i1.y = 1.0 - i1.x;
 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
 // x0 = x0 - 0.0 + 0.0 * C.xx ;
 // x1 = x0 - i1 + 1.0 * C.xx ;
 // x2 = x0 - 1.0 + 2.0 * C.xx ;
 vec4 x12 = x0.xyxy + C.xxzz;
 x12.xy -= i1;

// Permutations
 i = mod289(i); // Avoid truncation effects in permutation
 vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
       + i.x + vec3(0.0, i1.x, 1.0 ));

 vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
 m = m*m ;
 m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

 vec3 x = 2.0 * fract(p * C.www) - 1.0;
 vec3 h = abs(x) - 0.5;
 vec3 ox = floor(x + 0.5);
 vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
 m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
 vec3 g;
 g.x  = a0.x  * x0.x  + h.x  * x0.y;
 g.yz = a0.yz * x12.xz + h.yz * x12.yw;
 return noiseFactor * dot(m, g);
}`

const colorFuncs=`       
float blendColorDodge(float base, float blend) {
    return (blend==1.0)?blend:min(base/(1.0-blend),1.0);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
    return vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));
}

vec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {
    return (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));
}


vec3 brightnessContrast(in vec3 value, in float brightness,in float contrast)
{
    value = ( value - 0.5 ) * contrast + 0.5 + brightness;

    return value;
}

vec3 czm_saturation(vec3 rgb, float adjustment)
{
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

float gradientNoise(in vec2 uv)
{
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
}`

/**
 * @typedef MagicMarbleMaterialProps
 * @property {number} step - Which step of the color sequence we're on
 *
 * @param {MagicMarbleMaterialProps & THREE.MeshStandardMaterialParameters}
 */

 interface MagicMarbleMatiralProps {
    step: number
    roughness:number
  }
  const MagicMarbleMaterial = ({ step,roughness}:MagicMarbleMatiralProps,{...props }) => {
  
    const { volumeColor,iterations,depth,smoothing,displacement,rayDirPos,rayOrigPos } = useControls('shader',{

      volumeColor: {
        value: {
          r:0,
          g:0,
          b:255,
        },
        onChange: (v) => {
          uniforms.volumeColor.value = new THREE.Color(v.r/255, v.g/255, v.b/255)
        }
      },
      iterations: {
        value: 48,
        min: 1,
        max: 96,
        step: 1,
        onChange: (v) => {
          uniforms.iterations.value = v;
        }
      },
      depth: {
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          uniforms.depth.value = v;
        }
      },
      smoothing: {
        value: 0.02,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          uniforms.smoothing.value = v;
        }
      },
      displacement: {
        value: 0.01,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          uniforms.displacement.value = v;
        }
      },
      rayDirPos: {
        value: {
          x:0,
          y:0,
          z:1,
        },
        onChange: (v) => {
          uniforms.rayDirPos.value = new THREE.Vector3(v.x,v.y,v.z)
        }
      },
      rayOrigPos: {
        value: {
          x:0,
          y:0,
          z:0,
        },
        onChange: (v) => {
          uniforms.rayOrigPos.value = new THREE.Vector3(v.x,v.y,v.z)
        }
      },

    }) as {
      volumeColor: { r: number; g: number; b: number }
      iterations: number
      depth: number
      smoothing: number
      displacement: number
      rayDirPos: { x: number; y: number; z: number }
      rayOrigPos: { x: number; y: number; z: number }
    }

    
    
    const baseMapPath = './assets/noise1.png'
    const heightVolumeMapPath = './assets/noise2.png'
    const displacementMapPath = './assets/noise3D.jpg'

    let baseMap = new THREE.TextureLoader().load( baseMapPath )
    let heightVolumeMap = new THREE.TextureLoader().load( heightVolumeMapPath )
    let displacementMap = new THREE.TextureLoader().load( displacementMapPath )

    baseMap.minFilter = displacementMap.minFilter = heightVolumeMap.minFilter = THREE.NearestFilter
    baseMap.wrapS = baseMap.wrapT = THREE.MirroredRepeatWrapping
    heightVolumeMap.wrapS = heightVolumeMap.wrapT = THREE.MirroredRepeatWrapping
    displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping

    const { baseMapUrl,heightVolumeMapUrl,displacementMapUrl } = useControls('map',
      { baseMapUrl: { 
          image: baseMapPath,
          onChange: (v) => {
            baseMap = new THREE.TextureLoader().load( v )
            baseMap.minFilter = displacementMap.minFilter = THREE.NearestFilter
            baseMap.wrapS = baseMap.wrapT = THREE.MirroredRepeatWrapping
            uniforms.baseMap.value=baseMap
          }
        },
        heightVolumeMapUrl: { 
          image: heightVolumeMapPath,
          onChange: (v) => {
            heightVolumeMap = new THREE.TextureLoader().load( v )
            heightVolumeMap.minFilter = heightVolumeMap.minFilter = THREE.NearestFilter
            heightVolumeMap.wrapS = heightVolumeMap.wrapT = THREE.MirroredRepeatWrapping

            uniforms.heightVolumeMap.value=heightVolumeMap
          }
        },
        displacementMapUrl: {
          image: displacementMapPath,
          onChange: (v) => {
            displacementMap = new THREE.TextureLoader().load( v )
            displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping
            uniforms.displacementMap.value=displacementMap
          }
        },

      }
    ) as{
      baseMapUrl: string
      heightVolumeMapUrl: string
      displacementMapUrl: string
    }

    // Create persistent local uniforms object
    const [uniforms] = useState(() => ({
      time: { value: 0 },
      volumeColor: { value: volumeColor?new THREE.Color(volumeColor.r/255,volumeColor.g/255,volumeColor.b/255):new THREE.Color(0,0,1) },
      baseMap: { value: baseMap },
      heightVolumeMap: { value: heightVolumeMap },
      displacementMap: { value: displacementMap },
      iterations: { value: iterations },
      depth: { value: depth },
      smoothing: { value: smoothing },
      displacement: { value: displacement },
      rayDirPos:{value:rayDirPos},
      rayOrigPos:{value:rayOrigPos},
    }))
  
    // This spring value allows us to "fast forward" the displacement in the marble
    const { timeOffset } = useSpringThree({
      hsl: options[step % options.length],
      timeOffset: step * 0.2,
      config: { tension: 50 },
      onChange: ({ value: { hsl } }) => {
        const [h, s, l] = hsl
        uniforms.volumeColor.value.setHSL(h / 360, s / 100, l / 100)
      },
    })
  
    // Update time uniform on each frame
    useFrame(({ clock }) => {
      uniforms.time.value = timeOffset.get() + clock.elapsedTime * 0.05
    })
  
    // Add our custom bits to the MeshStandardMaterial
    const onBeforeCompile = (shader: { uniforms: any; vertexShader: string; fragmentShader: string }) => {
      // Wire up local uniform references
      shader.uniforms = { ...shader.uniforms, ...uniforms }
  
      // Add to top of vertex shader
      shader.vertexShader =
        /* glsl */ `
        varying vec3 v_pos;
        varying vec3 v_dir;
        varying vec2 vUv;
      ` + shader.vertexShader
  
      // Assign values to varyings inside of main()
      shader.vertexShader = shader.vertexShader.replace(
        /void main\(\) {/,
        (match) =>
          match +
          /* glsl */ `
          vUv = uv;
          v_dir = position - cameraPosition; // Points from camera to vertex
          v_pos = position;
          `
      )
  
      // Add to top of fragment shader
      shader.fragmentShader =
        /* glsl */ `
        #define FLIP vec2(1., -1.)
        
        uniform vec3 volumeColor;
        uniform sampler2D baseMap;
        uniform sampler2D heightVolumeMap;
        uniform sampler2D displacementMap;
        uniform int iterations;
        uniform float depth;
        uniform float smoothing;
        uniform float displacement;
        uniform float time;
        uniform vec3 rayDirPos;
        uniform vec3 rayOrigPos;
        
        varying vec3 v_pos;
        varying vec3 v_dir;
        varying vec2 vUv;
      ` + shader.fragmentShader
  
      // Add above fragment shader main() so we can access common.glsl.js
      shader.fragmentShader = shader.fragmentShader.replace(
        /void main\(\) {/,
        (match) =>
        sNoiseFuncs + colorFuncs + 
        /* glsl */ `

        vec3 displacePoint(vec3 p, float strength) {
          vec2 uv = equirectUv(normalize(p));
          vec2 scroll = vec2(time, 0.);
          vec3 displacementA = texture(displacementMap, uv + scroll).rgb; // Upright
                    vec3 displacementB = texture(displacementMap, uv * FLIP - scroll).rgb; // Upside down
          
          // Center the range to [-0.5, 0.5], note the range of their sum is [-1, 1]
          displacementA -= 0.5;
          displacementB -= 0.5;
          
          return p + strength * (displacementA + displacementB);
        }
          
        /**
        * @param rayOrigin - Point on sphere
        * @param rayDir - Normalized ray direction
        * @returns Diffuse RGB color
        */

        vec3 raymarching_sphere(vec3 rayOrigin, vec3 rayDir) {
          float perIteration = 1. / float(iterations);
          vec3 deltaRay = rayDir * perIteration * depth;

          // Start at point of intersection and accumulate volume
          vec3 p = rayOrigin;
          float totalVolume = 0.;

          for (int i=0; i<iterations; ++i) {
            // Read baseMap from spherical direction of displaced ray position
            vec3 displaced = displacePoint(p, displacement);
            vec2 uv = equirectUv(normalize(displaced));
            
            float s = snoise(vec2(uv.x*1.+time*10.,uv.y*1.3+time*10.));
            uv*= vec2( 1.0 + s * (100.) );
            float heightMapVal = texture(heightVolumeMap, uv).r;

            // Take a slice of the heightMap
            float height = length(p); // 1 at surface, 0 at core, assuming radius = 1
            float cutoff = 1. - float(i) * perIteration;
            float slice = smoothstep(cutoff, cutoff + smoothing, heightMapVal);

            // Accumulate the volume and advance the ray forward one step
            totalVolume += slice * perIteration;
            p += deltaRay;
          }

          vec3 displaced2 = displacePoint(p, displacement);
          vec2 uv2 = equirectUv(normalize(displaced2));
          
          // distort the baseMap's UVs with noise
          float s2 = snoise(vec2(uv2.x*1.- time*10.,uv2.y*1.3 - time*10.));
          uv2*= vec2( 1.0 + s2 * (100.) );

          return mix( texture(baseMap, uv2).rgb, volumeColor*1.0, totalVolume);
        }
        ` + match
      )
  
      shader.fragmentShader = shader.fragmentShader.replace(
        /vec4 diffuseColor.*;/,
        /* glsl */ `
        vec3 rayDir = normalize(v_dir) + rayDirPos;
        vec3 rayOrigin = v_pos + rayOrigPos;
        vec3 rgb = raymarching_sphere(rayOrigin, rayDir);
        vec4 diffuseColor = vec4(rgb, 1.);      
        `
      )
    }
  
    return (
      <meshStandardMaterial
        {...props}
        roughness={roughness}
        onBeforeCompile={onBeforeCompile}
        // The following props allow React hot-reload to work with the onBeforeCompile argument
        onUpdate={(m) => (m.needsUpdate = true)}
        customProgramCacheKey={() => onBeforeCompile.toString()}
      />
    )
  }
  
  
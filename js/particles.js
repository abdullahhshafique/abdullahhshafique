import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('particlesBg');
if (!canvas) throw new Error('Canvas not found');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 768px)').matches;
const isTiny = matchMedia('(max-width: 480px)').matches;

const COUNT = isTiny ? 2000 : isMobile ? 4000 : 12000;
const rand = Math.random,
    gauss = () => (rand() + rand() + rand() - 1.5) * 0.8;

const posArr = new Float32Array(COUNT * 3),
    ringId = new Float32Array(COUNT),
    seeds = new Float32Array(COUNT),
    scales = new Float32Array(COUNT);

const rings = [
    { r: 6.4, tx: -0.5, tz: 0 },
    { r: 5.3, tx: 0.9, tz: 0.7 },
    { r: 4.2, tx: 0.25, tz: -1.1 }
];

for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3,
        pick = rand();
    seeds[i] = rand();
    scales[i] = seeds[i] > 0.985 ? 2.4 : 0.5 + rand() * 0.9;

    if (pick < 0.12) {
        ringId[i] = 4;
        let x = gauss(),
            y = gauss(),
            z = gauss();
        const n = Math.hypot(x, y, z) || 1,
            r = 7.5 + rand() * 5.5;
        posArr[i3] = x / n * r;
        posArr[i3 + 1] = y / n * r;
        posArr[i3 + 2] = z / n * r;
        continue;
    }
    if (pick < 0.24) {
        ringId[i] = 3;
        let x = gauss(),
            y = gauss(),
            z = gauss();
        const n = Math.hypot(x, y, z) || 1,
            r = 1.7 * Math.cbrt(rand());
        posArr[i3] = x / n * r;
        posArr[i3 + 1] = y / n * r;
        posArr[i3 + 2] = z / n * r;
        continue;
    }
    ringId[i] = i % 3;
    const ring = rings[i % 3],
        ang = rand() * Math.PI * 2;
    const x = Math.cos(ang) * ring.r + gauss() * 0.07,
        y = gauss() * 0.07,
        z = Math.sin(ang) * ring.r + gauss() * 0.07;
    let y2 = y * Math.cos(ring.tx) - z * Math.sin(ring.tx);
    const z2 = y * Math.sin(ring.tx) + z * Math.cos(ring.tx);
    const x2 = x * Math.cos(ring.tz) - y2 * Math.sin(ring.tz);
    y2 = x * Math.sin(ring.tz) + y2 * Math.cos(ring.tz);
    posArr[i3] = x2;
    posArr[i3 + 1] = y2;
    posArr[i3 + 2] = z2;
}

// ── shaders ──
const SNOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

const VERT = `
  attribute float aSeed;attribute float aScale;attribute float aRing;
  uniform float uTime;uniform float uSize;uniform float uPixelRatio;
  uniform vec3 uColor;uniform vec3 uCore;uniform vec3 uRing0;uniform vec3 uRing1;uniform vec3 uRing2;
  varying vec3 vColor;varying float vTwinkle;
  ${SNOISE}
  void main(){
    vec3 pos=position;
    if(aRing<2.5){vec3 ax=aRing<0.5?normalize(vec3(1.0,0.18,0.0)):aRing<1.5?normalize(vec3(0.0,1.0,0.22)):normalize(vec3(0.25,0.0,1.0));float ang=uTime*(aRing<0.5?0.24:aRing<1.5?-0.38:0.55);float c=cos(ang),s=sin(ang);pos=pos*c+cross(ax,pos)*s+ax*dot(ax,pos)*(1.0-c);}
    vec3 np=pos*0.2+vec3(uTime*0.18)+aSeed*6.28;
    pos+=vec3(snoise(np),snoise(np+31.7),snoise(np+74.3))*0.13;
    pos.x+=sin(uTime*0.9+aSeed*40.0)*0.05;
    pos.y+=cos(uTime*0.7+aSeed*30.0)*0.05;
    vColor=uColor;
    if(aRing<2.5){vColor=aRing<0.5?uRing0:aRing<1.5?uRing1:uRing2;}
    vColor=mix(vColor,uCore,smoothstep(2.5,1.4,length(pos)));
    vColor=mix(vColor,vec3(1.0),step(0.985,aSeed)*0.9);
    vTwinkle=0.6+0.4*sin(uTime*(0.6+aSeed*1.8)+aSeed*20.0);
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=uSize*aScale*uPixelRatio*(12.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }`;

const FRAG = `
  precision mediump float;
  uniform float uOpacity;
  varying vec3 vColor;varying float vTwinkle;
  void main(){
    float d=length(gl_PointCoord-0.5);
    float alpha=smoothstep(0.5,0.12,d);
    alpha+=smoothstep(0.12,0.0,d)*0.5;
    gl_FragColor=vec4(vColor,alpha*vTwinkle*uOpacity);
  }`;

// ── renderer ──
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const pr = Math.min(devicePixelRatio, isTiny ? 1 : isMobile ? 1.25 : 1.75);
renderer.setPixelRatio(pr);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a0a0c');

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 14.5;

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
geo.setAttribute('aRing', new THREE.BufferAttribute(ringId, 1));

const uniforms = {
    uTime: { value: 0 },
    uSize: { value: isTiny ? 2.2 : isMobile ? 2.6 : 3.0 },
    uPixelRatio: { value: pr },
    uOpacity: { value: 0.8 },
    uColor: { value: new THREE.Color('#f5b8d0') },
    uCore: { value: new THREE.Color('#ffd9e8') },
    uRing0: { value: new THREE.Color('#c26a97') },
    uRing1: { value: new THREE.Color('#f5b8d0') },
    uRing2: { value: new THREE.Color('#ffe3ef') }
};

const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const group = new THREE.Group();
group.add(new THREE.Points(geo, mat));
scene.add(group);

let composer = null;
if (!isMobile && !isTiny && !reduced) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.85, 0.55, 0.12
    );
    composer.addPass(bloom);
}

let mx = 0,
    my = 0,
    tmx = 0,
    tmy = 0;

window.addEventListener('pointermove', (e) => {
    tmx = e.clientX / window.innerWidth - 0.5;
    tmy = e.clientY / window.innerHeight - 0.5;
});

// ── scroll blur: sharp → 50% blur at About → sharp at Contact ──
let scrollBlur = 0;
let currentBlur = 0;

function updateBlur() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollY / docH;
    
    // Get section positions dynamically
    const architectureSection = document.getElementById('architecture');
    const aboutSection = document.getElementById('about');
    const contactSection = document.getElementById('contact');
    
    // Default positions if sections not found
    let archProgress = 0.18;  // Architecture section start
    let aboutProgress = 0.45; // About section start
    let contactProgress = 0.80; // Contact section start
    
    if (architectureSection) {
        archProgress = architectureSection.offsetTop / docH;
    }
    if (aboutSection) {
        aboutProgress = aboutSection.offsetTop / docH;
    }
    if (contactSection) {
        contactProgress = contactSection.offsetTop / docH;
    }
    
    let targetBlur = 0;
    
    if (progress < archProgress) {
        // Hero to Architecture: 0% blur
        targetBlur = 0;
    } else if (progress < aboutProgress) {
        // Architecture to About: 0% → 50% blur
        const range = aboutProgress - archProgress;
        const t = (progress - archProgress) / range;
        // Ease in-out for smoother transition
        const eased = t * t * (3 - 2 * t); // smoothstep
        targetBlur = eased * 0.2;
    } else if (progress < contactProgress) {
        // About to Contact: 50% → 0% blur
        const range = contactProgress - aboutProgress;
        const t = (progress - aboutProgress) / range;
        // Ease in-out for smoother transition
        const eased = 1 - (t * t * (3 - 2 * t)); // reverse smoothstep
        targetBlur = eased * 0.2;
    } else {
        // Contact+: 0% blur
        targetBlur = 0;
    }
    
    scrollBlur = Math.max(0, Math.min(0.5, targetBlur));
}

window.addEventListener('scroll', updateBlur, { passive: true });
updateBlur();
const clock = new THREE.Clock();

function frame() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // Smooth blur transition
    currentBlur += (scrollBlur - currentBlur) * 0.05;
    
    // Apply blur to entire canvas via CSS
    const blurPx = currentBlur * 16; // max 8px blur
    canvas.style.filter = `blur(${blurPx}px)`;
    canvas.style.opacity = String(1 - currentBlur * 0.3); // slight fade too

    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;

    group.rotation.y = mx * 0.35 + t * 0.06 + Math.sin(t * 0.07) * 0.06;
    group.rotation.x = my * 0.22 + Math.sin(t * 0.23) * 0.1;

    if (composer) composer.render();
    else renderer.render(scene, camera);

    requestAnimationFrame(frame);
}

if (reduced) {
    uniforms.uTime.value = 1;
    renderer.render(scene, camera);
} else {
    requestAnimationFrame(frame);
}

// ── resize ──
function onResize() {
    const w = window.innerWidth,
        h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
}
window.addEventListener('resize', onResize);
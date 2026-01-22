/**
 * Premium Prompts Library - Emerald & Snow Edition
 */

export const PREMIUM_DESIGN_PROMPT = `
You are a world-class UI/UX Designer and Frontend Architect. 
Your goal is to generate HIGH-END, ARCHITECTURAL website code that follows the "Emerald & Snow" design system.

STRICT CONSTRAINTS:
1. COLORS: Use ONLY Solid White (#FFFFFF) and Deep Forest Green (#06231A). 
2. NO TRANSPARENCY: All backgrounds and elements must be 100% opaque. Do NOT use rgba(), opacity, or backdrop-filter.
3. NO GRADIENTS: Use solid blocks of color only. High-end design comes from proportion, not flashy gradients.
4. TYPOGRAPHY: Use 'Outfit' for headings and 'Inter' for body text. Headings should be bold and precisely spaced.
5. UI/UX:
   - Use generous whitespace (80px+ between sections).
   - Use thin, high-contrast borders (1px solid #E0E7E4) for separation.
   - Implement "Bento Grid" or clean asymmetrical layouts.
   - Micro-interactions must be subtle (0.2s duration max).

6. WEB 3D CAPABILITY (IF REQUESTED):
   - Use Three.js for architectural, low-poly 3D elements in a solid-color environment.
   - Backgrounds should be static White or Deep Green, never gradient.

OUTPUT FORMAT:
- Return ONLY valid HTML5, solid CSS (in <style>), and JS (in <script>).
- Use Semantic HTML (<header>, <main>, <section>, <article>, <footer>).
`;

export const WEB_3D_HELPER = `
// Solid Render Web3D Helper
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

export function createScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Precise White Background

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true }); // Opaque
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return { scene, camera, renderer };
}
`;

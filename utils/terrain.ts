import * as THREE from 'three';
import { LEGO_COLORS, SCENE_CONFIG, STONE_VARIANTS, FOLIAGE_VARIANTS } from '../constants';
import { BrickData } from '../types';

// --- Noise Functions ---
const fract = (x: number) => x - Math.floor(x);
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];

const random2D = (x: number, z: number) => {
  const sin = Math.sin(dot([x, z], [12.9898, 78.233]));
  return fract(sin * 43758.5453);
};

const noise = (x: number, z: number) => {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const f = fract(x);
  const g = fract(z);

  const a = random2D(i, j);
  const b = random2D(i + 1, j);
  const c = random2D(i, j + 1);
  const d = random2D(i + 1, j + 1);

  const u = f * f * (3.0 - 2.0 * f);
  const v = g * g * (3.0 - 2.0 * g);

  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
};

const fbm = (x: number, z: number, octaves: number) => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, z * frequency);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return value;
};

// --- Geometry Helper Functions ---

const getWallPathZ = (x: number) => {
  // Serpentine shape
  return Math.sin(x * 0.05) * 20 + Math.sin(x * 0.15) * 8;
};

const getRidgeHeight = (x: number) => {
  // Mountain spine
  return 15 + Math.sin(x * 0.04) * 12 + Math.cos(x * 0.1) * 5;
};

// Core function to determine the "natural" height of the terrain at any x,z
const getTerrainY = (x: number, z: number) => {
  const wallZ = getWallPathZ(x);
  const distToWallCenter = Math.abs(z - wallZ);
  const ridgeY = getRidgeHeight(x);
  
  // Slope calculation
  const slopeNoise = fbm(x * 0.1, z * 0.1, 2) * 5;
  let groundY = ridgeY - (distToWallCenter * 1.2) + slopeNoise;
  
  // Base roughness
  groundY += fbm(x * 0.05, z * 0.05, 3) * 8;
  
  // Floor
  if (groundY < 1) groundY = 1 + random2D(x, z) * 0.5;
  
  return Math.floor(groundY);
};

export const generateLegoWorld = (): BrickData[] => {
  const bricks: BrickData[] = [];
  const sizeX = SCENE_CONFIG.CHUNKS_X;
  const sizeZ = SCENE_CONFIG.CHUNKS_Z;

  // Helper to check if coordinate is in bounds
  const isOutOfBounds = (x: number, z: number) => Math.abs(x) > sizeX || Math.abs(z) > sizeZ;

  for (let x = -sizeX; x <= sizeX; x++) {
    for (let z = -sizeZ; z <= sizeZ; z++) {
      
      const y = getTerrainY(x, z);
      
      // --- 1. Gap Filling (Anti-Floating) ---
      // Look at neighbors to see if we are on a cliff edge.
      // If a neighbor is significantly lower, we need to fill the gap downwards.
      let minNeighborY = y;
      
      // Sample neighbors (N, S, E, W)
      const neighbors = [
        !isOutOfBounds(x + 1, z) ? getTerrainY(x + 1, z) : y,
        !isOutOfBounds(x - 1, z) ? getTerrainY(x - 1, z) : y,
        !isOutOfBounds(x, z + 1) ? getTerrainY(x, z + 1) : y,
        !isOutOfBounds(x, z - 1) ? getTerrainY(x, z - 1) : y,
      ];
      
      minNeighborY = Math.min(...neighbors);
      
      // How far down to fill? We don't want to fill to infinity for performance.
      // Fill down to the lowest neighbor, clamped to a max depth of ~4-6 bricks.
      // This makes the terrain look solid from most angles.
      const fillDepth = Math.min(y - minNeighborY, 6); 
      const layersToRender = 1 + Math.max(0, fillDepth);

      // Determine Surface Properties
      const wallZ = getWallPathZ(x);
      const distToWallCenter = Math.abs(z - wallZ);
      let isSnow = false;
      let surfaceColor = LEGO_COLORS.DARK_GREEN;
      let brickName = "Grass Block";
      let brickDesc = "Lush vegetation covering the hills.";

      if (y > 28 && distToWallCenter > 10) {
        isSnow = true;
        surfaceColor = LEGO_COLORS.SNOW;
        brickName = "Snowy Peak";
        brickDesc = "Eternal snow on the highest ridges.";
      } else if (y > 15) {
         const rockMix = random2D(x, z);
         if (rockMix > 0.6) {
             surfaceColor = LEGO_COLORS.DARK_GRAY;
             brickName = "Granite Rock";
             brickDesc = "Solid mountain bedrock.";
         } else if (rockMix > 0.3) {
             surfaceColor = LEGO_COLORS.BLUISH_GRAY;
             brickName = "Limestone";
         } else {
             surfaceColor = LEGO_COLORS.OLIVE;
             brickName = "Highland Moss";
         }
      } else {
         const lushMix = fbm(x * 0.2, z * 0.2, 1);
         surfaceColor = FOLIAGE_VARIANTS[Math.floor(Math.abs(lushMix) * FOLIAGE_VARIANTS.length) % FOLIAGE_VARIANTS.length];
      }

      // Render the column
      for (let i = 0; i < layersToRender; i++) {
        const currentY = y - i;
        // If we are deep underground relative to this column (i > 0), make it dirt/stone color
        let color = surfaceColor;
        let name = brickName;
        
        if (i > 0) {
            // Subsurface is usually dirt or stone
            color = (y > 15) ? LEGO_COLORS.DARK_GRAY : LEGO_COLORS.BROWN;
            name = (y > 15) ? "Mountain Bedrock" : "Dirt Foundation";
        }

        bricks.push({
          position: new THREE.Vector3(x, currentY, z),
          color: color,
          type: isSnow ? 'snow' : 'terrain',
          name: name,
          description: i === 0 ? brickDesc : "Supporting terrain foundation."
        });
      }

      // --- 2. Wall & Tower Generation ---
      const towerPhase = Math.round(x) % SCENE_CONFIG.TOWER_INTERVAL;
      const isTowerZone = (towerPhase > -4 && towerPhase < 4);
      
      const wallWidth = 1.5; 
      const towerWidth = 4.5;
      const isWall = distToWallCenter < wallWidth;
      const isTower = isTowerZone && distToWallCenter < towerWidth;

      if (isTower || isWall) {
        const structureBase = y + 1;
        const structureHeight = isTower ? SCENE_CONFIG.WALL_HEIGHT_BASE + 5 : SCENE_CONFIG.WALL_HEIGHT_BASE;

        for (let h = 0; h < structureHeight; h++) {
          const currentY = structureBase + h;
          const weathering = fbm(x * 0.5, currentY * 0.5, 1);
          let brickColor = STONE_VARIANTS[Math.floor(Math.abs(weathering * 10)) % STONE_VARIANTS.length];
          let name = "Ancient Wall Brick";
          
          if (isTower) {
             name = "Watchtower Fortification";
             const isTowerEdge = distToWallCenter > 3.5 || Math.abs(towerPhase) > 2;
             // Windows
             if (h > 4 && h < structureHeight - 2 && isTowerEdge) {
                if ((h % 3 === 0)) continue; // Window gap
             }
             if (h === structureHeight - 2) brickColor = LEGO_COLORS.DARK_GRAY;
          } else {
             if (h === structureHeight - 2) {
                 brickColor = LEGO_COLORS.DARK_TAN;
                 name = "Walkway Paving";
             }
          }
          
          // Crenellations
          if (h === structureHeight - 1) {
             const isEdge = isTower ? (distToWallCenter > 3.5 || Math.abs(towerPhase) > 2) : (distToWallCenter > 0.5);
             if (isEdge) {
                if ((x + z) % 2 !== 0) continue;
                name = "Battlement";
             } else {
                continue;
             }
          }

          bricks.push({
            position: new THREE.Vector3(x, currentY, z),
            color: brickColor,
            type: isTower ? 'tower' : 'wall',
            name: name,
            description: "Part of the Ming Dynasty construction."
          });
        }
      } 
      // --- 3. Vegetation ---
      else if (!isSnow && y < 25) {
         const treeNoise = random2D(x, z);
         // Trees
         if (treeNoise > 0.97 && distToWallCenter > 3) {
             const treeHeight = 3 + Math.floor(Math.random() * 4);
             
             // Trunk (ensure it connects to ground)
             bricks.push({ 
                 position: new THREE.Vector3(x, y + 1, z), 
                 color: LEGO_COLORS.BROWN, 
                 type: 'foliage',
                 name: 'Pine Trunk'
             });
             bricks.push({ 
                 position: new THREE.Vector3(x, y + 2, z), 
                 color: LEGO_COLORS.BROWN, 
                 type: 'foliage',
                 name: 'Pine Trunk'
             });
             
             const leafColor = (Math.random() > 0.5) ? LEGO_COLORS.DARK_GREEN : LEGO_COLORS.OLIVE;
             
             // Leaves
             for (let ly = 0; ly < treeHeight; ly++) {
                const py = y + 2 + ly;
                const radius = Math.floor((treeHeight - ly) * 0.6);
                for (let lx = -radius; lx <= radius; lx++) {
                    for (let lz = -radius; lz <= radius; lz++) {
                        // Don't overwrite trunk
                        if (lx === 0 && lz === 0 && ly < treeHeight - 1) continue;
                        
                        if (Math.abs(lx) + Math.abs(lz) <= radius + 0.5) {
                           bricks.push({ 
                               position: new THREE.Vector3(x + lx, py, z + lz), 
                               color: leafColor, 
                               type: 'foliage',
                               name: 'Pine Needles',
                               description: 'Evergreen foliage adapted to the harsh climate.'
                           });
                        }
                    }
                }
             }
         } else if (treeNoise > 0.90 && distToWallCenter > 2) {
             // Bushes
             bricks.push({ 
                 position: new THREE.Vector3(x, y + 1, z), 
                 color: LEGO_COLORS.GREEN, 
                 type: 'foliage',
                 name: 'Mountain Shrub'
             });
         }
      }
    }
  }
  return bricks;
};

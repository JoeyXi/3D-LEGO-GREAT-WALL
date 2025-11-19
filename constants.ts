// Official LEGO Color Palette approximations
export const LEGO_COLORS = {
  // Greens
  DARK_GREEN: '#2E5543', // Earth Green
  GREEN: '#237841',      // Dark Green
  OLIVE: '#6B8E23',      // Olive Green
  BRIGHT_GREEN: '#4B9F4A', // Bright Green
  SAND_GREEN: '#A0BCAC', // Sand Green
  
  // Earth Tones
  BROWN: '#582A12',      // Reddish Brown
  DARK_BROWN: '#352100', // Dark Brown
  DARK_TAN: '#958A73',   // Dark Tan
  TAN: '#E4CD9E',        // Brick Yellow
  WARM_TAN: '#D6C595',   // Custom sunlit stone
  
  // Grays (Stone)
  LIGHT_GRAY: '#9BA19D', // Medium Stone Grey
  DARK_GRAY: '#635F52',  // Dark Stone Grey
  VERY_LIGHT_GRAY: '#E5E4DE', // White/Gray mix
  BLUISH_GRAY: '#6C6E68', // Dark Bluish Gray
  
  // Others
  BLACK: '#1B2A34',      // Black
  WATER: '#0055BF',      // Dark Azure
  FOAM: '#C0DFF6',       // Light Royal Blue
  RED: '#C91A09',        // Bright Red (flags)
  GOLD: '#C2B280',       // Gold (accents)
  SNOW: '#FFFFFF',       // White
};

// A mix of tans and grays to match the sunlit wall in the photo
export const STONE_VARIANTS = [
  LEGO_COLORS.LIGHT_GRAY,
  LEGO_COLORS.TAN,
  LEGO_COLORS.WARM_TAN, 
  LEGO_COLORS.DARK_TAN,
  LEGO_COLORS.LIGHT_GRAY,
];

export const FOLIAGE_VARIANTS = [
  LEGO_COLORS.DARK_GREEN,
  LEGO_COLORS.GREEN,
  LEGO_COLORS.OLIVE,
  LEGO_COLORS.BRIGHT_GREEN,
  LEGO_COLORS.SAND_GREEN
];

export const SCENE_CONFIG = {
  CHUNKS_X: 80, // Longer drawing distance
  CHUNKS_Z: 50, // Wider mountains
  SCALE: 1, 
  WALL_HEIGHT_BASE: 7,
  TOWER_INTERVAL: 35,
};
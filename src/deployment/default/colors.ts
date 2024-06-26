const colors = {
  // Brand guidelines say:
  // "Each of the main primary colours can be tinted by 80%, 50%, 30%, 20% and 10% if needed."
  // We've assumed this means tints and shades.
  // Colours created via e.g.
  // https://maketintsandshades.com/#6C4BC1
  purple: {
    50: "#e2dbf3", // 80% tint
    100: "#b6a5e0", // 50% tint
    200: "#9881d4", // 30% tint
    300: "#896fcd", // 20% tint
    400: "#7b5dc7", // 10% tint
    // Brand color
    500: "#6c4bc1",
    // Unused for now: '#6144ae', // 10% shade
    600: "#563c9a", // 20% shade
    700: "#4c3587", // 30% shade
    800: "#362661", // 50% shade
    900: "#160f27", // 80% shade
  },
  teal: {
    50: "#e5f5f3", // 80% tint
    100: "#bde6e1", // 50% tint
    200: "#a3dcd4", // 30% tint
    300: "#95d7ce", // 20% tint
    400: "#88d2c8", // 10% tint
    // Brand color
    500: "#7bcdc2", // note this is 400 in the other scale
    // Unused for now: '#6fb9af', // 10% shade
    600: "#62a49b", // 20% shade
    700: "#569088", // 30% shade
    800: "#3e6761", // 50% shade
    900: "#192927", // 80% shade
  },
  blue: {
    50: "#d4eaf7", // 80% tint
    100: "#95caeb", // 50% tint
    200: "#6ab4e2", // 30% tint
    300: "#55a9de", // 20% tint
    400: "#3f9fda", // 10% tint
    // Brand color
    500: "#2a94d6",
    // Unused for now: '#2685c1', // 10% shade
    600: "#2276ab", // 20% shade
    700: "#1d6896", // 30% shade
    800: "#154a6b", // 50% shade
    900: "#081e2b", // 80% shade
  },
  green: {
    50: "#cceccc", // 80% tint
    100: "#80d080", // 50% tint
    200: "#4dbd4d", // 30% tint
    300: "#33b333", // 20% tint
    400: "#1aaa1a", // 10% tint
    // Brand color
    500: "#00a000",
    // Unused for now: '#009000', // 10% shade
    600: "#008000", // 20% shade
    700: "#007000", // 30% shade
    800: "#005000", // 50% shade
    900: "#002000", // 80% shade
  },
  // Not calling this red as we use Chakra's reds for form errors etc.
  pink: {
    50: "#f5cde0", // 80% tint
    100: "#e681b2", // 50% tint
    200: "#dc4f93", // 30% tint
    300: "#d73584", // 20% tint
    400: "#d21c74", // 10% tint
    // Brand color
    500: "#cd0365",
    // Unused for now: '#b9035b', // 10% shade
    600: "#a40251", // 20% shade
    700: "#900247", // 30% shade
    800: "#670233", // 50% shade
    900: "#290114", // 80% shade
  },
  orange: {
    50: "#fae0de", // 80% tint
    100: "#f3b2ae", // 50% tint
    200: "#ee938d", // 30% tint
    300: "#ec837d", // 20% tint
    400: "#e9746c", // 10% tint
    // Brand color
    500: "#e7645c",
    // Unused for now: '#d05a53', // 10% shade
    600: "#b9504a", // 20% shade
    700: "#a24640", // 30% shade
    800: "#74322e", // 50% shade
    900: "#2e1412", // 80% shade
  },
};

export default colors;

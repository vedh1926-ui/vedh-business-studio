import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vedh: {
          burgundy: {
            950: "#2B0B12",
            900: "#3D0E18",
            850: "#4D1220",
            800: "#5E1727",
            700: "#751D31",
            600: "#8F243C",
            500: "#AB2E4A",
          },
          cream: {
            50: "#FDFBF7",
            100: "#F9F5EE",
            200: "#F2EBE0",
            300: "#E8DDCF",
            400: "#D9C9B4",
          },
          gold: {
            200: "#F3E3B5",
            300: "#E9D08A",
            400: "#DDB858",
            500: "#C69C31",
            600: "#A87E1F",
            700: "#805E15",
          },
          charcoal: {
            900: "#1C1717",
            800: "#2B2424",
            700: "#423A3A",
            600: "#635B5B",
          }
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

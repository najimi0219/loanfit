import type { Config } from "tailwindcss";
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [
    require("tailwind-scrollbar")({ nocompatible: true }), // これで .scrollbar-* が使える
  ],
}


const config: Config = {
    darkMode: "class",   // ← これを追加

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;

 import type { Config } from "tailwindcss";
 
 const config: Config = {
   content: [
     "./app/**/*.{js,ts,jsx,tsx,mdx}",
     "./components/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   theme: {
     extend: {
       colors: {
         background: "var(--background)",
         foreground: "var(--foreground)",
         muted: {
           DEFAULT: "var(--muted)",
           foreground: "var(--muted-foreground)",
         },
         primary: {
           DEFAULT: "var(--primary)",
           foreground: "var(--primary-foreground)",
         },
         secondary: "var(--secondary)",
         accent: "var(--accent)",
         border: "var(--border)",
         ring: "var(--ring)",
       },
       fontFamily: {
         sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
         mono: ["var(--font-geist-mono)", "monospace"],
       },
     },
   },
   plugins: [require("@tailwindcss/typography")],
 };
 
 export default config;

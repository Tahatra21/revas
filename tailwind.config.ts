import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: "#020617", // slate-950
                surface: "#0f172a", // slate-900
                "surface-border": "#1e293b", // slate-800
                primary: "#f8fafc", // slate-50
                "primary-subtle": "#94a3b8", // slate-400
                accent: "#3b82f6", // blue-500
            },
        },
    },
    plugins: [],
};

export default config;

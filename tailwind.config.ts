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
                bg: "#ffffff", // white
                surface: "#f8fafc", // slate-50
                "surface-border": "#e2e8f0", // slate-200
                primary: "#0f172a", // slate-900
                "primary-subtle": "#64748b", // slate-500
                accent: "#3b82f6", // blue-500
            },
        },
    },
    plugins: [],
};

export default config;

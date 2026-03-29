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
                primary: "#534AB7",
                "primary-light": "#EEEDFE",
                "primary-dark": "#3C3489",
                available: "#1D9E75",
                "available-bg": "#f0faf6",
                flexible: "#EF9F27",
                "flexible-bg": "#fef9f0",
                busy: "#E24B4A",
                "busy-bg": "#fef2f2",
            },
            fontFamily: {
                sans: [
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "sans-serif",
                ],
            },
            maxWidth: {
                app: "430px",
            },
        },
    },
    plugins: [],
};

export default config;
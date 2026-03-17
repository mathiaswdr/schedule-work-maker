import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		screens: {
			// '2xl': {'max': '1535px'},
			// => @media (max-width: 1535px) { ... }
	  
			'ms': {'max': '1279px'},
			// => @media (max-width: 1279px) { ... }
	  
			'mb': {'max': '1023px'},
			// => @media (max-width: 1023px) { ... }
	  
			// 'md': {'max': '767px'},
			// => @media (max-width: 767px) { ... }
	  
			// 'sm': {'max': '639px'},
			// => @media (max-width: 639px) { ... }
		  },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
			paper: '#f7f1e6',
			ink: '#1d1b16',
			'ink-muted': '#6b645d',
			panel: '#fffaf2',
			line: 'rgb(29 27 22 / 0.12)',
			'line-strong': 'rgb(29 27 22 / 0.2)',
			'ink-soft': 'rgb(29 27 22 / 0.1)',
			brand: 'rgb(249 115 22 / <alpha-value>)',
			'brand-2': 'rgb(15 118 110 / <alpha-value>)',
			'brand-3': 'rgb(250 204 21 / <alpha-value>)'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;

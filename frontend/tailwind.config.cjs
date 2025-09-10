/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx,js,jsx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#ecfdf5',
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399',
					500: '#10b981',
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
				},
				accent: '#111827',
			},
			borderRadius: {
				lg: '12px',
				xl: '16px',
			},
			boxShadow: {
				card: '0 4px 14px rgba(0,0,0,0.06)',
				cardHover: '0 10px 24px rgba(0,0,0,0.09)',
			},
			container: {
				center: true,
				padding: {
					DEFAULT: '1rem',
					sm: '1rem',
					md: '1.5rem',
					lg: '2rem',
					xl: '2rem',
				},
			},
		},
	},
	plugins: [],
}

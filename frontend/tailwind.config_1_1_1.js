
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Plus Jakarta Sans','Inter','sans-serif'], display: ['Sora','sans-serif'] },
      colors: { brand: { 50:'#eef2ff',100:'#e0e7ff',500:'#6366f1',600:'#4f46e5',700:'#4338ca',900:'#312e81'}, ink:{900:'#0f0f14',800:'#1a1a23',700:'#2a2a38'} },
      boxShadow: { 'soft':'0 8px 30px rgba(0,0,0,0.06)','premium':'0 20px 60px -15px rgba(99,102,241,0.3)','card':'0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -15px rgba(0,0,0,0.08)' }
    },
  },
  plugins: [],
}

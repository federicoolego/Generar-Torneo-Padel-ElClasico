/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta tomada del logo de El Clásico
        noche: '#0D053E',   // índigo del fondo del logo: texto principal, barra lateral
        cancha: {
          DEFAULT: '#0E599C', // azul del escudo: acciones primarias
          claro: '#2474C4',
          suave: '#DDE7F4',
        },
        clasico: {
          rojo: '#DD2C40',  // rojo del escudo y la estrella
          verde: '#7DB33A', // cinta "Fútbol & Pádel"
        },
        vidrio: '#F2F1F8',  // fondo general, con un toque del índigo
        pelota: '#D2DA1F',  // amarillo de la pelota: ganador / clasificado
        red: { DEFAULT: '#B42318' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

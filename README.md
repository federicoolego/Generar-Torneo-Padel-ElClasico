# Generador de Torneos · El Clásico

App web para armar las zonas y el playoff de cada categoría de un torneo, generar las imágenes
para WhatsApp y **cargar los resultados** (las posiciones de zona y los cruces se completan solos).

- Vite + React + TypeScript + Tailwind. Se publica en GitHub Pages.
- Datos en **Supabase**, tablas con prefijo `torneos_elclasico_` (esquema en `supabase/torneos_elclasico.sql`).

## Flujo

1. **Torneo:** nombre (incluye la categoría), fechas, inscripción, premio y formato por instancia.
2. **Parejas:** se pegan una por línea o separadas por `;` (`Juan Pérez / Luis Gómez; Juan Galeano / Marcos Francés`).
3. **Zonas:** sorteo aleatorio o por orden de carga, ajuste manual y, por cada zona, **cuándo empieza** (día, hora y complejo del primer partido; los demás partidos no se programan en la app). Ahí mismo se cargan los **resultados** de cada partido (validados según el formato) y se calculan las posiciones.
4. **Playoff:** "Armar automático" (1° de zona primero, después 2° y 3°) y ajuste manual de cada cruce. El armado separa lo más posible a las parejas de una misma zona: si se tienen que cruzar, que sea lo más tarde posible (semifinal o final). Se ve como **cuadro en llaves**; tocando un partido se carga el resultado y el ganador avanza solo. No tiene día ni horario.
5. **Imágenes:** zonas (con el inicio de cada una) y playoff, con logo, nombre, fechas, inscripción y premio; el playoff se va completando con nombres y resultados.

El **botón verde flotante** (abajo a la derecha) genera las imágenes desde cualquier paso y las
comparte. En el celular abre el menú de compartir del sistema, donde se elige WhatsApp. En una
compu que no permite compartir archivos, las descarga para adjuntarlas a mano.

## Base de datos y acceso

1. En el SQL Editor de Supabase corré `supabase/torneos_elclasico.sql` (se puede volver a correr).
2. **Authentication → Users → Add user**: `elclasico@generador.elclasico.com.ar`, con contraseña y *Auto Confirm User*.
   En la app se entra con usuario `ELCLASICO` y esa contraseña.
3. Solo los emails de `torneos_elclasico_usuarios` pueden leer y escribir (RLS), aunque haya otros usuarios en el proyecto.

## Publicar

1. Subí el contenido de esta carpeta (incluida `.github`) al repo `Generar-Torneos-Padel-Clasico`, rama `main`.
2. **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Environments → github-pages → Environment variables**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Cada push publica en `https://<usuario>.github.io/Generar-Torneos-Padel-Clasico/`.

Con dominio propio, cambiá en `.github/workflows/deploy.yml` la línea `BASE_PATH` por `BASE_PATH: /`.

## Local

```bash
npm install
# .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

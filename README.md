# FUGA

Control de gastos recurrentes. HTML, CSS y JavaScript sin dependencias ni build.

## Estructura

```
index.html
css/  variables.css · animations.css · styles.css
js/   storage.js · ui.js · app.js
```

`styles.css` importa los otros dos CSS, por eso `index.html` enlaza solo uno.

## Datos

Se guardan en `localStorage` bajo la clave `fuga-v2`. Los registros de la versión
anterior se conservan: al cargar se completan con los campos nuevos
(`category`, `notes`) y la categoría se deduce del nombre una sola vez.

Forma de cada registro:

```js
{
  id, name, amount, currency,   // "CLP" | "USD"
  frequency,                    // monthly | quarterly | semiannual | yearly
  nextCharge,                   // "AAAA-MM-DD", ancla del ciclo
  category, notes, color, paused
}
```

`nextCharge` es el ancla, no una fecha que haya que ir moviendo. Todo el resto
se calcula desde ahí.

## Las dos cifras

Son distintas a propósito:

- **Caja del mes** — lo que sale efectivamente en un mes. Una suscripción anual
  pesa completa en su mes y cero en los otros. Es lo que muestra el inicio.
- **Promedio normalizado** — el costo repartido en doce. Sirve para comparar
  entre sí suscripciones con frecuencias distintas. Vive en Estadísticas.

## Publicar

Carpeta estática. Cloudflare Pages, GitHub Pages o Netlify sin configuración.
Debe servirse por HTTP: abrir el archivo con `file://` rompe `crypto.randomUUID`
en algunos navegadores (hay respaldo) y bloquea las fuentes.

## Respaldos

Ajustes exporta JSON (respaldo completo, restaurable) y CSV con separador `;`
y BOM UTF-8, listo para Excel en español.

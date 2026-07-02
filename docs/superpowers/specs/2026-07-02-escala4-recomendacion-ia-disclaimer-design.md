# Escala de 4 opciones + recomendación IA + disclaimer final

Fecha: 2026-07-02 · Estado: aprobado por Matías

## Contexto

El explorador Rumbo tiene un test RIASEC de 12 ítems con escala de 3 opciones
(0-2), una pantalla de resultados con recomendación determinística por área, y
una encuesta final. Existe un experimento A/B (100% vs 25% de testimonios) que
no debe romperse.

## 1. Escala de 4 opciones (Likert forzada, sin punto medio)

- `SCALE` en `src/lib/riasec.ts` pasa a: ¡Me copa! 😍 =3 · Me gusta 🙂 =2 ·
  No mucho 😕 =1 · Nah 🙅 =0.
- Motivo: la opción del medio no aporta señal; 4 opciones fuerzan una
  inclinación hacia "sí" o "no".
- El scoring ipsativo (desviación del promedio propio) no requiere cambios.
- `TestView` renderiza `SCALE` dinámicamente: sin cambios de UI.
- Sesiones previas quedan en otra escala; se excluyen del análisis igual que
  las pre-experimento.

## 2. Recomendación con IA (complementa, no reemplaza)

- El cálculo RIASEC sigue decidiendo el área al instante, como hoy.
- Nueva ruta `POST /api/explorer/recommendation`:
  - Body: `{ sessionId, profile: { riasec, top, area } }`.
  - Lee las respuestas abiertas (q1-q3) desde `pre_answers` de la sesión.
  - Llama a Anthropic (patrón fetch de `summary/route.ts`), modelo
    **`claude-haiku-4-5`** (elegido por costo, decisión de Matías).
  - La IA recomienda 1-2 carreras de las 7 existentes + explicación breve en
    rioplatense. Respuesta JSON validada contra las claves de `CAREERS`.
  - Resultado cacheado en columna nueva `ai_recommendation` (jsonb) de
    `explorer_sessions` — idempotente por sesión y queda para análisis.
    Si el `area` del perfil cambia (rehizo el test), se regenera.
  - Sin `ANTHROPIC_API_KEY` → 501; si la API falla → la tarjeta no se muestra
    y el flujo actual no cambia.
- UI: tarjeta "🤖 Recomendación personalizada" en Resultados, carga en
  paralelo con skeleton; no bloquea la pantalla.

## 3. Disclaimer al final

Bloque suave en la pantalla `Done`: "esto no define tu vida, es una brújula
para explorar y valida una hipótesis de un proyecto de la facultad".

## Alcance

`riasec.ts`, `db/schema.ts` (+ ALTER TABLE), `api/explorer/recommendation/route.ts`
(nuevo), `explorar/page.tsx`. No se toca el experimento A/B ni las métricas.

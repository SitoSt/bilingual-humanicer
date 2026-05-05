# Mejorar estimador de sílabas en español

## Problema

El estimador actual `estimateSyllablesES()` en `src/stats.js` funciona bien para palabras simples con reglas claras de diptongos/hiatos, pero tiene margen de mejora en casos complejos.

## Estado actual

El algoritmo usa un enfoque basado en posiciones de vocales y fusión de adyacentes:
- ✅ Funciona bien en ~70-80% de palabras
- ⚠️ Falla en algunos hiatos y palabras con sufijos (-ción, -dad, -mente)
- ❌ Requiere validación exhaustiva con más corpus de prueba

## Casos problemáticos conocidos

| Palabra | Esperado | Actual |
|---------|----------|--------|
| hua | 2 | 2 ✓ |
| hue | 2 | 2 ✓ |
| lluvia | 2 | 3 ❌ |
| ciudad | 3 | 2 ❌ |
| universidad | 6 | 5 ❌ |
| extraordinario | 6 | 7 ❌ |

## Tareas pendientes

### 1. Validación con corpus más amplio
Generar más párrafos de prueba con palabras variadas y validar manualmente el conteo de sílabas.
Definir un conjunto de palabras de prueba covering:
- Diptongos (ui, iu, eu, ue, ao, ie, ei, etc.)
- Hiatos (ía, uié, ué, etc.)
- Triptongos (buey, Paraguay)
- Palabras con -ción, -dad, -mente
- Palabras con prefijos y raíces complejas

### 2. Optimización de rendimiento
El algoritmo actual escanea la string múltiples veces. Explorar alternativa que use solo una pasada:
- Recoger posiciones de vocales (1 pasada)
- Analizar pares consecutivos (1 pasada sobre posiciones)
- Posible usar regex para pre-procesamiento

Métricas objetivo: < 1ms por palabra en promedio.

### 3. Reglas de hiato específicas
Refinar las reglas de diptongo vs hiato:
- **Stressed weak (í, ú)** → siempre rompe diptongo con cualquier vocal adyacente
- **Strong + weak sin estrés** → generalmente diptongo (u-a = ua)
- **Strong + strong** → siempre hiato
- **Weak + weak sin estrés** → diptongo (ui, iu)

### 4. Sufijos especiales
Algunos sufijos pueden tener reglas específicas:
- **-ción / -sión**: la sílaba "ción" cuenta como 2 (no 1)
- **-dad / -tad**: similar, cuenta como 2
- **-mente**: cuenta como 2 cuando funciona como sufijo adverbial

## Impacto

El impacto en IFSZ y detección de IA es moderado. El IFSZ tiene margen natural ±10-15%, por lo que errores moderados en silabificación no afectan críticamente la puntuación final. Sin embargo, para precisión óptima conviene mejorar.

## Notas adicionales

- Los tests actuales en `tests/statistics.test.js` incluyen casos básicos
- Considerar crear `tests/es/syllables-es.test.js` con corpus más amplio
- Investigar reglas de la RAE para silabificación española

---

**Fecha de creación**: 2026-05-05  
**Estado**: Pendiente  
**Prioridad**: Media  
**Etiquetas**: i18n, spanish, stats, improvement
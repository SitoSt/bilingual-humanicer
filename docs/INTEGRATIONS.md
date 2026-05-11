# Integraciones

Bilingual Humanizer funciona en tres niveles según el agente y el entorno. Elige el que corresponda a tu caso.

## ¿Qué instalar según tu agente?

| Agente | Cómo instalar la skill | CLI / MCP |
| --- | --- | --- |
| OpenClaw | `clawhub install bilingual-humanicer` | `npm install -g bilingual-humanizer` |
| Claude Code | Clonar repo + copiar `SKILL.md` y `knowledge/` | `npm install -g bilingual-humanizer` |
| Claude Desktop | Clonar repo + copiar `SKILL.md` y `knowledge/` | Configurar MCP server |
| Web / cualquier agente | Clonar repo + copiar `SKILL.md` y `knowledge/` | — |

---

## Nivel 1 — Skill (autónoma)

Instala la skill y su base de conocimiento de patrones. Funciona sin código externo — el agente aplica los patrones de `knowledge/` directamente.

### OpenClaw

```bash
clawhub install bilingual-humanicer
```

ClawHub descarga automáticamente `SKILL.md` y la carpeta `knowledge/` al directorio de skills de OpenClaw.

### Claude Code, Claude Desktop y otros agentes

Clona el repositorio y copia los archivos de skill al directorio que tu agente reconoce:

```bash
git clone https://github.com/SitoSt/bilingual-humanicer.git
```

Copia `SKILL.md` y la carpeta `knowledge/` a la ubicación de skills de tu agente:

- **Claude Code**: directorio de skills de tu instalación (p.ej. `~/.claude/skills/bilingual-humanicer/`)
- **Claude Desktop**: directorio de skills configurado en tu instalación
- **Otros agentes**: directorio que el agente reconoce como base de conocimiento

El agente tendrá acceso a `SKILL.md` y a los 49 detectores de patrones en `knowledge/`. Para análisis estadístico preciso (burstiness, TTR, score numérico), añade el nivel 2.

---

## Nivel 2a — CLI (Claude Code, OpenClaw, terminal)

Instala el CLI para que el agente pueda ejecutar análisis desde la terminal:

```bash
npm install -g bilingual-humanizer
```

El agente usa los comandos vía JSON para integrar los resultados con la skill:

```bash
humanizer score -f texto.md --json
humanizer analyze -f texto.md --json
humanizer suggest -f texto.md --json
```

Ver todos los comandos disponibles en [GUIDE.md](GUIDE.md).

---

## Nivel 2b — MCP server (Claude Desktop)

Instala el MCP server y configúralo en Claude Desktop:

```bash
npm install -g bilingual-humanizer
```

Añade a `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "humanizer": {
      "command": "node",
      "args": ["/ruta/absoluta/a/bilingual-humanicer/mcp-server/index.js"]
    }
  }
}
```

Herramientas disponibles tras reiniciar Claude Desktop:

| Herramienta | Equivalente CLI | Descripción |
| --- | --- | --- |
| `humanizer.score` | `humanizer score` | Puntuación rápida (0-100) |
| `humanizer.analyze` | `humanizer analyze` | Análisis completo con patrones |
| `humanizer.humanize` | `humanizer humanize` | Sugerencias + autofix opcional |
| `humanizer.stats` | `humanizer stats` | Métricas estadísticas crudas |

---

## Uso en CI/CD

### Gate básico con GitHub Actions

```yaml
name: AI writing gate
on: [pull_request]

jobs:
  humanizer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g bilingual-humanizer
      - run: humanizer scan docs --ext md --fail-above 50 --ignore-code
```

### Gate de regresiones (sin bloquear deuda existente)

```bash
# Guardar baseline en main
humanizer scan docs --json > .humanizer-baseline.json

# En cada PR: solo fallar si algo empeora
humanizer scan docs --baseline .humanizer-baseline.json --fail-on-regression
```

Códigos de salida: `0` éxito · `1` error · `2` fail-above · `3` regresión.

---

## API HTTP (integraciones custom)

Para aplicaciones propias, el servidor HTTP expone los mismos endpoints:

```bash
node api-server/server.js
```

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/score` | POST | Puntuación rápida |
| `/api/analyze` | POST | Análisis completo |
| `/api/humanize` | POST | Sugerencias + autofix |
| `/api/stats` | POST | Solo estadísticas |
| `/api/openapi` | GET | Schema OpenAPI |

```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"text": "En el contexto actual, es importante destacar...", "lang": "es"}'
```

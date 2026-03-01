# ATOM AI Agent Builder — DevDay 2026

Plataforma visual para construir y probar agentes de IA conversacionales aplicados a una concesionaria de autos. Construida para el **ATOM DevDay Challenge 2026**.

---

## Demo

> Corre localmente en `http://localhost:3000`

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Agrega tu OPENAI_API_KEY en .env.local

# 3. Iniciar servidor de desarrollo
npm run dev
```

---

## Arquitectura

### Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js 15** (App Router) + TypeScript | SSR, API routes integradas, tipado estricto |
| Editor visual | **React Flow** (`@xyflow/react`) | Nodos arrastrables, conectables y customizables out-of-the-box |
| Estado global | **Zustand** | Store liviano sin boilerplate, compatible con SSR |
| IA | **OpenAI GPT-4o / GPT-4o-mini** | Mejor balance calidad/velocidad/costo |
| Streaming | **SSE (Server-Sent Events)** | Respuesta en tiempo real sin WebSockets |
| Estilos | **Tailwind CSS** | Desarrollo rápido con design system consistente |
| RAG | **JSON estático** (autos.json, faq.json, dates.json) | Base requerida por el challenge |

---

### Pipeline de orquestación multi-agente

El flujo completo de cada mensaje del usuario:

```
📨 Mensaje del usuario
        │
        ▼
🧠 Nodo de Memoria
   (historial de conversación en sesión)
        │
        ▼
🎯 Agente Orquestador  ── gpt-4o-mini, JSON mode
   Clasifica intent:
   ┌─ catalogo          → ✅ Validador → 🤖 Especialista Catálogo
   ├─ citas             → ✅ Validador → 🤖 Especialista Citas
   ├─ consulta_general  → ✅ Validador → 🤖 Especialista Consultas
   └─ out_of_scope      ─────────────→ 💬 Agente Genérico
        │
        ▼
🔧 RAG: JSON estático inyectado en system prompt
   (inventario, FAQs, agenda según el especialista activo)
        │
        ▼
📤 Respuesta al cliente (streaming SSE → gpt-4o)
```

### Decisiones técnicas clave

**1. 2-step pipeline (orquestador → especialista)**

El orquestador usa `gpt-4o-mini` con `response_format: json_object` — rápido y barato para clasificación. El especialista usa `gpt-4o` con streaming para máxima calidad en la respuesta final. Esto reduce costos ~80% vs usar gpt-4o para todo.

**2. Validador intent-aware**

El validador recibe el intent detectado en su system prompt y sabe exactamente qué campos recopilar según el caso de uso activo (catálogo, citas o consultas). Evita preguntar datos innecesarios.

**3. Validation completion por intent**

La validación se considera completa cuando los campos mínimos requeridos están presentes:
- Catálogo: `presupuesto` + `preferencia`
- Citas: `nombre` + `fecha_preferida`
- Consultas: `cliente_tipo` + `situacion_laboral`

Fallback: después de 3+ turnos del usuario, el especialista recibe lo que haya.

**4. RAG en system prompt (no vector DB)**

Los JSONs oficiales se inyectan directamente en el system prompt del agente activo usando `buildRagContext()`. Para el inventario de autos (100+ unidades), se comprime a campos clave + descripción de 120 chars para no sobrepasar el contexto.

**5. Nodos = configuración pura**

Los nodos no ejecutan lógica — son objetos JSON que viajan del canvas → Zustand store → API route. La API interpreta el grafo y construye el pipeline en tiempo de ejecución. Esto hace el sistema completamente configurable sin cambiar código.

---

## Casos de uso implementados

### Caso 1 — Consultas Generales ✅
El usuario pregunta sobre horarios, financiamiento, garantías, proceso de compra.

**Validador recopila:**
- ¿Cliente nuevo o existente?
- Situación laboral (asalariado / independiente)
- Edad aproximada

**Especialista Consultas** personaliza la respuesta según el perfil usando `faq.json`.

### Caso 2 — Catálogo de Vehículos ✅
El usuario busca autos disponibles por precio, tipo, características.

**Validador recopila:**
- Presupuesto aproximado (MXN)
- ¿Nuevo o usado?
- ¿Descuento de empleado?
- Preferencia de tipo (Sedán / SUV / Pickup / Hatchback)

**Especialista Catálogo** filtra `autos.json` y recomienda máximo 3 opciones. Aplica descuento de empleado (8%) si aplica.

### Caso 3 — Agendamiento de Cita ✅
El usuario quiere agendar prueba de manejo o cita con asesor.

**Validador recopila:**
- Nombre completo
- Fecha preferida
- Hora preferida
- Motivo (prueba de manejo / asesoría)
- Vehículo de interés (si aplica)

**Especialista Citas** verifica disponibilidad en `dates.json` y confirma o propone alternativa. Horarios en UTC-6 (Guatemala).

---

## Nodos del editor visual

| Nodo | Tipo | Función |
|---|---|---|
| 🟦 Canal Web | `start` | Punto de entrada, recibe el mensaje |
| 🟣 Nodo de Memoria | `memory` | Contexto de sesión en memoria |
| 🔵 Agente Orquestador | `orchestrator` | Clasifica intent, extrae datos |
| 🟡 Agente Validador | `validator` | Recopila datos faltantes por intent |
| 🟪 Especialista Catálogo | `specialist` | RAG sobre inventario de autos |
| 🟪 Especialista Citas | `specialist` | RAG sobre agenda de horarios |
| 🟪 Especialista Consultas | `specialist` | RAG sobre FAQs, respuesta personalizada |
| ⬜ Agente Genérico | `generic` | Saludos, fuera de scope |
| 🔧 Tool / JSON | `tool` | Fuente de datos estática configurable |
| 🟢 Respuesta al Cliente | `output` | Canal de salida |

---

## Estructura del proyecto

```
app/
├── api/chat/route.ts       # Pipeline de orquestación (SSE, RAG, routing)
├── components/
│   ├── Canvas.tsx          # Editor visual (React Flow)
│   ├── Header.tsx          # Topbar con metadata del workflow
│   ├── PropertiesPanel.tsx # Panel de configuración por nodo
│   ├── SidebarLeft.tsx     # Paleta de nodos arrastrables
│   ├── SidebarRight.tsx    # Playground + Debug Console
│   └── WorkflowNode.tsx    # Componente visual de nodo
├── data/
│   ├── autos.json          # Inventario de vehículos (oficial)
│   ├── dates.json          # Agenda de horarios (oficial)
│   └── faq.json            # Preguntas frecuentes (oficial)
├── hooks/useChat.ts        # SSE consumer, parser de eventos
├── store/workflowStore.ts  # Estado global (Zustand)
└── types/workflow.ts       # Interfaces TypeScript compartidas
```

---

## Variables de entorno

```env
# .env.local
OPENAI_API_KEY=sk-...
```

---

## Lista de tareas por miembro

> *Incluir aquí la división de trabajo del equipo.*

| Tarea | Miembro |
|---|---|
| Arquitectura base (Next.js + React Flow + Zustand) | — |
| Diseño visual de nodos y editor | — |
| Pipeline de orquestación (API route, SSE) | — |
| RAG con JSON oficiales | — |
| Properties Panel y configuración de nodos | — |
| Playground y Debug Console | — |
| Casos de uso (Catálogo, Citas, Consultas) | — |
| README y documentación | — |

---

## Criterios de evaluación cubiertos

| Criterio | Estado |
|---|---|
| ✅ Editor visual drag & drop | Implementado con React Flow |
| ✅ 3 casos de uso | Catálogo + Citas + Consultas Generales |
| ✅ Validador por caso de uso | Intent-aware, campos por intent |
| ✅ RAG con JSON oficiales | autos.json, faq.json, dates.json |
| ✅ Playground chat en vivo | SSE streaming en tiempo real |
| ✅ Debug console | Pipeline state visible por mensaje |
| ✅ Configuración de nodos | Properties panel por tipo de nodo |
| ✅ Arquitectura escalable | Nodos = config pura, API stateless |

---

*ATOM DevDay Challenge 2026 — AI Agent Builder Platform*

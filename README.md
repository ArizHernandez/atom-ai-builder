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

## Caso de uso Consencionario
JSON con el workflow configurado

```json
{
  "nodes": [
    {
      "id": "node-start",
      "type": "start",
      "position": {
        "x": 60,
        "y": 340
      },
      "data": {
        "id": "node-start",
        "type": "start",
        "label": "Canal Web",
        "subtitle": "Mensaje entrante",
        "config": {}
      },
      "measured": {
        "width": 260,
        "height": 114
      }
    },
    {
      "id": "node-memory",
      "type": "memory",
      "position": {
        "x": 340,
        "y": 340
      },
      "data": {
        "id": "node-memory",
        "type": "memory",
        "label": "Nodo de Memoria",
        "subtitle": "Contexto de sesión",
        "config": {}
      },
      "measured": {
        "width": 260,
        "height": 106
      }
    },
    {
      "id": "node-orchestrator",
      "type": "orchestrator",
      "position": {
        "x": 630,
        "y": 340
      },
      "data": {
        "id": "node-orchestrator",
        "type": "orchestrator",
        "label": "Agente Orquestador",
        "subtitle": "Router de intenciones",
        "config": {
          "agent_role": "orchestrator",
          "system_prompt": "Eres el Orquestador de AutoMóvil Premium. Analiza la intención del cliente y responde ÚNICAMENTE con JSON:\n{\n  \"intent\": \"catalogo | citas | consulta_general | out_of_scope\",\n  \"confidence\": 0.0-1.0,\n  \"next_agent\": \"validator | specialist | generic\",\n  \"requires_validation\": true/false,\n  \"extracted_data\": { \"cliente_tipo\": null, \"presupuesto\": null, \"preferencia\": null, \"nombre\": null, \"fecha_preferida\": null },\n  \"reasoning\": \"explicación breve\"\n}"
        }
      },
      "measured": {
        "width": 260,
        "height": 141
      }
    },
    {
      "id": "node-validator",
      "type": "validator",
      "position": {
        "x": 950,
        "y": 140
      },
      "data": {
        "id": "node-validator",
        "type": "validator",
        "label": "Agente Validador",
        "subtitle": "Recopila datos del cliente",
        "config": {
          "agent_role": "validator",
          "description": "Recopila los datos necesarios del cliente de forma conversacional, uno a la vez:\n- Para catálogo: presupuesto, tipo de vehículo (SUV/Sedan/Pickup), ¿nuevo o usado?\n- Para citas: nombre, fecha, hora, vehículo de interés\n- Para consultas: ¿cliente nuevo o existente?, ¿asalariado o independiente?\nSi ya tienes todos los datos, confirma que la información está completa.",
          "validation_fields": [
            "cliente_tipo",
            "presupuesto",
            "preferencia"
          ]
        }
      },
      "measured": {
        "width": 260,
        "height": 155
      }
    },
    {
      "id": "node-specialist-catalogo",
      "type": "specialist",
      "position": {
        "x": 950,
        "y": 380
      },
      "data": {
        "id": "node-specialist-catalogo",
        "type": "specialist",
        "label": "Especialista Catálogo",
        "subtitle": "Vehículos y precios",
        "config": {
          "agent_role": "specialist_catalogo",
          "system_prompt": "Eres el Especialista de Catálogo. Filtra el inventario según el perfil del cliente (segmento: SUV/Sedán/Hatchback/Pickup, precio máximo, transmisión, tipo de combustible) y recomienda máximo 3 opciones. Para cada opción muestra: Marca Modelo Año, Precio en MXN, Ciudad/Estado, Kilometraje y una razón breve por qué se ajusta. Sé conciso y usa formato de lista.",
          "use_inventory": true
        }
      },
      "measured": {
        "width": 260,
        "height": 141
      }
    },
    {
      "id": "node-specialist-citas",
      "type": "specialist",
      "position": {
        "x": 950,
        "y": 600
      },
      "data": {
        "id": "node-specialist-citas",
        "type": "specialist",
        "label": "Especialista Citas",
        "subtitle": "Agendamiento y disponibilidad",
        "config": {
          "agent_role": "specialist_citas",
          "system_prompt": "Eres el Especialista de Citas. Ayuda al cliente a agendar una prueba de manejo o cita con asesor. Usa los horarios disponibles de la agenda. Confirma: nombre del cliente, fecha, hora (en hora local Guatemala UTC-6), vehículo de interés y motivo. Resume la cita antes de confirmar.",
          "use_agenda": true
        }
      },
      "measured": {
        "width": 260,
        "height": 157
      }
    },
    {
      "id": "node-generic",
      "type": "generic",
      "position": {
        "x": 950,
        "y": 820
      },
      "data": {
        "id": "node-generic",
        "type": "generic",
        "label": "Agente Genérico",
        "subtitle": "Saludos y fuera de scope",
        "config": {
          "agent_role": "generic",
          "system_prompt": "Eres un asistente amigable de AutoMóvil Premium. Maneja saludos, despedidas y preguntas generales. Si el tema no es de la concesionaria, redirige amablemente al usuario hacia los servicios que sí ofreces: catálogo de vehículos, citas y consultas.",
          "use_faqs": true
        }
      },
      "measured": {
        "width": 260,
        "height": 137
      }
    },
    {
      "id": "node-output",
      "type": "output",
      "position": {
        "x": 1280,
        "y": 490
      },
      "data": {
        "id": "node-output",
        "type": "output",
        "label": "Respuesta al Cliente",
        "subtitle": "Canal Web",
        "config": {}
      },
      "measured": {
        "width": 150,
        "height": 123
      }
    }
  ],
  "edges": [
    {
      "id": "e-start-memory",
      "source": "node-start",
      "target": "node-memory",
      "type": "smoothstep",
      "style": {
        "stroke": "#3b4154",
        "strokeWidth": 2
      }
    },
    {
      "id": "e-memory-orch",
      "source": "node-memory",
      "target": "node-orchestrator",
      "type": "smoothstep",
      "style": {
        "stroke": "#3b4154",
        "strokeWidth": 2
      }
    },
    {
      "id": "e-orch-validator",
      "source": "node-orchestrator",
      "target": "node-validator",
      "type": "smoothstep",
      "style": {
        "stroke": "#f59e0b",
        "strokeWidth": 2,
        "strokeDasharray": "5 3"
      }
    },
    {
      "id": "e-orch-catalogo",
      "source": "node-orchestrator",
      "target": "node-specialist-catalogo",
      "type": "smoothstep",
      "style": {
        "stroke": "#8b5cf6",
        "strokeWidth": 2,
        "strokeDasharray": "5 3"
      }
    },
    {
      "id": "e-orch-citas",
      "source": "node-orchestrator",
      "target": "node-specialist-citas",
      "type": "smoothstep",
      "style": {
        "stroke": "#8b5cf6",
        "strokeWidth": 2,
        "strokeDasharray": "5 3"
      }
    },
    {
      "id": "e-orch-generic",
      "source": "node-orchestrator",
      "target": "node-generic",
      "type": "smoothstep",
      "style": {
        "stroke": "#6b7280",
        "strokeWidth": 2,
        "strokeDasharray": "5 3"
      }
    },
    {
      "id": "e-validator-catalogo",
      "source": "node-validator",
      "target": "node-specialist-catalogo",
      "type": "smoothstep",
      "style": {
        "stroke": "#f59e0b",
        "strokeWidth": 2
      }
    },
    {
      "id": "e-catalogo-output",
      "source": "node-specialist-catalogo",
      "target": "node-output",
      "type": "smoothstep",
      "style": {
        "stroke": "#3b4154",
        "strokeWidth": 2
      }
    },
    {
      "id": "e-citas-output",
      "source": "node-specialist-citas",
      "target": "node-output",
      "type": "smoothstep",
      "style": {
        "stroke": "#3b4154",
        "strokeWidth": 2
      }
    },
    {
      "id": "e-generic-output",
      "source": "node-generic",
      "target": "node-output",
      "type": "smoothstep",
      "style": {
        "stroke": "#3b4154",
        "strokeWidth": 2
      }
    }
  ]
}
```

---

*ATOM DevDay Challenge 2026 — AI Agent Builder Platform*
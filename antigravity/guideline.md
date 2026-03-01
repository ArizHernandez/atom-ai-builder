# Arquitectura y Lineamientos: AI Agent Builder - ATOM 2026

## 1. Visión General del Proyecto
[cite_start]Desarrollar una plataforma con editor visual de flujos para construir agentes de IA especializados en una concesionaria de autos[cite: 5, 33]. [cite_start]El sistema debe permitir la configuración, conexión y prueba de agentes en un chat en vivo (Playground)[cite: 10, 34, 68].

## 2. Estructura de Comunicación (Standard Data Contract)
Para garantizar la expansibilidad (ej. integrar nuevos nodos como WhatsApp), todos los nodos deben consumir y producir un objeto de estado unificado:

```json
{
  "session": {
    "id": "uuid-string",
    "channel": "whatsapp | web | telegram",
    "memory_context": [] 
  },
  "pipeline": {
    "current_intent": "string",
    "extracted_data": {
      "cliente_tipo": "nuevo | existente",
      "presupuesto": "number",
      "preferencia": "SUV | Sedan | Pickup"
    },
    "is_validation_complete": false,
    "next_node_id": "string"
  },
  "output": {
    "text": "string",
    "status": "processing | final_response"
  }
}
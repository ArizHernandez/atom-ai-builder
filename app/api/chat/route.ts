import OpenAI from 'openai';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '@/app/types/workflow';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build a system prompt from the workflow node configuration
function buildSystemPromptFromWorkflow(nodes: Node<WorkflowNodeData>[]): string {
  const lines: string[] = [
    'You are an AI assistant configured by the following workflow pipeline.',
    'Behave according to the instructions of each node in this pipeline:',
    '',
  ];

  const order: WorkflowNodeData['type'][] = ['start', 'llm', 'specialist', 'output'];

  for (const nodeType of order) {
    const matching = nodes.filter((n) => n.data?.type === nodeType);
    for (const node of matching) {
      lines.push(`[${nodeType.toUpperCase()} NODE: ${node.data.label}]`);

      if (node.data.type === 'llm' && node.data.config?.system_prompt) {
        lines.push(`Instructions: ${node.data.config.system_prompt}`);
      }

      if (node.data.type === 'specialist' && node.data.config?.description) {
        lines.push(`Specialization: ${node.data.config.description}`);
      }

      lines.push('');
    }
  }

  lines.push(
    'Respond helpfully to the user based on this pipeline.',
    'Be concise. If the workflow is about customer support, act as a customer support agent.',
    'Never break character. Never mention that you are an AI model directly.'
  );

  return lines.join('\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages,
      workflow,
    }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      workflow?: { nodes: Node<WorkflowNodeData>[] };
    } = body;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPromptFromWorkflow(workflow?.nodes ?? []);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    // Convert OpenAI async iterable to a Web ReadableStream (SSE format)
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[chat/route] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

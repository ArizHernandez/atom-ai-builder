import Header from "./components/Header";
import SidebarLeft from "./components/SidebarLeft";
import SidebarRight from "./components/SidebarRight";
import Canvas from "./components/Canvas";
import { supabase } from "./lib/supabase";
import type { NodeType } from "@/app/types/workflow";

export type DraggableNode = {
  id?: string;
  type: NodeType;
  label: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  category: 'Core Flow' | 'Agentes' | 'Datos & Memoria';
  highlighted?: boolean;
};

export default async function Home() {
  const { data: nodes, error } = await supabase
    .from('workflow_nodes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching nodes:', error);
  }

  // Map db snake_case to camelCase
  const formattedNodes: DraggableNode[] = (nodes || []).map(n => ({
    id: n.id,
    type: n.type as NodeType,
    label: n.label,
    subtitle: n.subtitle,
    icon: n.icon,
    iconColor: n.icon_color,
    category: n.category as any,
    highlighted: n.highlighted
  }));

  return (
    <>
      <Header />
      <div className="flex flex-1 overflow-hidden w-full">
        <SidebarLeft initialNodes={formattedNodes} />
        <Canvas />
        <SidebarRight />
      </div>
    </>
  );
}

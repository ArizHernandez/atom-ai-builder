import Header from "./components/Header";
import SidebarLeft from "./components/SidebarLeft";
import SidebarRight from "./components/SidebarRight";
import Canvas from "./components/Canvas";

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-1 overflow-hidden w-full">
        <SidebarLeft />
        <Canvas />
        <SidebarRight />
      </div>
    </>
  );
}

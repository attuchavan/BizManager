import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import { Outlet } from "react-router-dom";

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Independent Scrollable Sidebar Container */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Column with Independent Scroll */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8 content-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
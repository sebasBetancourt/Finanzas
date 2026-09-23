import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

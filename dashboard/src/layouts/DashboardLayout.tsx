import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { CallWrapper } from "@/components/call";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CallWrapper>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </CallWrapper>
  );
}

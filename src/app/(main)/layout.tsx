import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { LazyCallWrapper } from "@/components/call/lazy-call-wrapper";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyCallWrapper>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </LazyCallWrapper>
  );
}

import { Navbar } from "@/components/shared/layout/navbar";
import { Sidebar } from "@/components/shared/layout/sidebar";
import { LazyCallWrapper } from "@/components/gaming/call/lazy-call-wrapper";

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
        <main id="main-content" className="lg:ml-64 pt-16 min-h-screen">
          {/* extra bottom padding so page content clears the fixed Feedback button */}
          <div className="p-4 lg:p-6 pb-24">{children}</div>
        </main>
      </div>
    </LazyCallWrapper>
  );
}

import AppHeader from "@/components/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 pb-16 sm:pb-0">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

import Nav from "@/components/Nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <Nav />
      <main className="flex-1 pb-16 pt-6">{children}</main>
    </div>
  );
}

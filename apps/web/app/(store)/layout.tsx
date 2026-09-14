import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { MobileCartBar } from "@/components/store/MobileCartBar";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60 selection:bg-emerald-100 selection:text-emerald-950">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {children}
      </main>
      <Footer />
      <MobileCartBar />
    </div>
  );
}

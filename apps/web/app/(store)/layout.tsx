import { Header } from "@/components/store/Header";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-neutral-200 mt-12 py-8 text-center text-xs text-neutral-500">
        <p className="font-semibold text-neutral-700">Swami Super Market • स्वामी सुपर मार्केट</p>
        <p className="mt-1">Usasa, Ballia, Uttar Pradesh • उसासा, बलिया (उ.प्र.)</p>
        <p className="mt-2 text-[11px] text-neutral-400">Phase 1: Catalog Core & Search • Designed for Local Daily Needs</p>
      </footer>
    </div>
  );
}

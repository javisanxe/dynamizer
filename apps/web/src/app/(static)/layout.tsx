import Navbar from '@/components/Navbar'

export default function StaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="static-layout">
      <Navbar />
      <main className="static-main">
        {children}
      </main>
    </div>
  )
}

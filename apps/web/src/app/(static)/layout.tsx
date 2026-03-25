import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function StaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="static-layout">
      <Navbar />
      <main className="static-main">
        {children}
      </main>
      <Footer />
    </div>
  )
}

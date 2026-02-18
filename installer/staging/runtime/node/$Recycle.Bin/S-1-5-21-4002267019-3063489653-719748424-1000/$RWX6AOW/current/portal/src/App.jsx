import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { usePortalConfig } from './hooks/useApi'
import Home from './pages/Home'
import Stores from './pages/Stores'
import Products from './pages/Products'
import Promos from './pages/Promos'
import Header from './components/Header'
import Footer from './components/Footer'
import AIAssistant from './components/AIAssistant'

export default function App() {
  const { config, loading } = usePortalConfig()
  const [assistantOpen, setAssistantOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header config={config} onOpenAssistant={() => setAssistantOpen(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home config={config} />} />
          <Route path="/tiendas" element={<Stores config={config} />} />
          <Route path="/productos" element={<Products config={config} />} />
          <Route path="/promos" element={<Promos config={config} />} />
        </Routes>
      </main>
      <Footer config={config} />

      {/* AI Assistant Modal */}
      {config?.settings?.ai_assistant_enabled !== false && (
        <AIAssistant
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          config={config}
        />
      )}

      {/* Floating AI Button (mobile) - only show if AI assistant is enabled */}
      {config?.settings?.ai_assistant_enabled !== false && !assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 flex items-center justify-center z-40 lg:hidden"
          aria-label="Abrir asistente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  )
}

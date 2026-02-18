import { useState, useRef, useEffect } from 'react'

export default function AIAssistant({ isOpen, onClose, config }) {
  const welcomeMessage = config?.settings?.ai_assistant_welcome ||
    'Hola! Soy tu asistente virtual del mercado de abastos. Puedo ayudarte a:\n\n- Buscar productos\n- Encontrar tiendas\n- Explicar como comprar\n- Resolver dudas\n\nEn que puedo ayudarte?'

  const assistantTitle = config?.settings?.ai_assistant_title || 'Asistente IA'

  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcomeMessage }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    // Simulate AI response (placeholder for real AI integration)
    setTimeout(() => {
      const response = generateResponse(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setLoading(false)
    }, 1000)
  }

  // Placeholder response generator
  const generateResponse = (query) => {
    const q = query.toLowerCase()

    if (q.includes('buscar') || q.includes('producto') || q.includes('encuentra')) {
      return 'Para buscar productos, puedes:\n\n1. Ir a la seccion "Productos" en el menu\n2. Usar el buscador en cualquier tienda\n3. Explorar por categorias\n\nQue producto te gustaria encontrar?'
    }

    if (q.includes('tienda') || q.includes('proveedor')) {
      return 'Tenemos varias tiendas disponibles en el directorio. Cada una ofrece productos frescos del mercado de abastos.\n\nVisita la seccion "Tiendas" para ver el catalogo completo y elegir tu proveedor favorito.'
    }

    if (q.includes('comprar') || q.includes('pedir') || q.includes('ordenar')) {
      return 'Para realizar una compra:\n\n1. Elige una tienda del directorio\n2. Agrega productos al carrito\n3. Completa tus datos de contacto\n4. Elige metodo de pago\n5. Confirma tu pedido\n\nEl proveedor te contactara para coordinar la entrega!'
    }

    if (q.includes('pago') || q.includes('pagar')) {
      return 'Metodos de pago disponibles:\n\n- Efectivo al recoger\n- Transferencia bancaria\n- MercadoPago (tarjetas)\n\nCada tienda puede tener diferentes opciones habilitadas.'
    }

    if (q.includes('entrega') || q.includes('envio') || q.includes('domicilio')) {
      return 'Las opciones de entrega varian por tienda:\n\n- Recoger en tienda\n- Entrega a domicilio\n- Envio a negocio\n\nConsulta las opciones disponibles al hacer tu pedido.'
    }

    if (q.includes('hola') || q.includes('buenos') || q.includes('que tal')) {
      return 'Hola! Es un gusto ayudarte. Estoy aqui para resolver tus dudas sobre el mercado de abastos.\n\nQue te gustaria saber?'
    }

    return 'Entiendo tu consulta. Para darte una mejor respuesta, te sugiero:\n\n- Explorar las tiendas disponibles\n- Revisar la seccion de productos\n- Contactar directamente al proveedor\n\nHay algo mas en lo que pueda ayudarte?'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">{assistantTitle}</h3>
              <p className="text-xs text-primary-100">Siempre disponible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Asistente en modo demo - Proximamente con IA real
          </p>
        </form>
      </div>
    </div>
  )
}

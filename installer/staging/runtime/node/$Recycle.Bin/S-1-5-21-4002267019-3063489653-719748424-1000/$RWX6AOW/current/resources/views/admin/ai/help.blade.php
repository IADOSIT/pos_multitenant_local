@extends('layouts.admin', ['title' => 'Asistente IA', 'header' => 'Asistente de Ayuda'])

@section('content')
<div class="max-w-3xl mx-auto" x-data="aiHelper()">
    <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-gray-800">Asistente de Ayuda</h1>
                    <p class="text-sm text-gray-500">Preguntame sobre como usar el sistema</p>
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div class="p-6 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4" id="chat-container">
            <!-- Welcome message -->
            <div class="flex gap-3" x-show="messages.length === 0">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <p class="text-sm text-gray-700">
                        Hola! Soy tu asistente de ayuda. Puedo ayudarte con preguntas sobre:
                    </p>
                    <ul class="text-sm text-gray-600 mt-2 space-y-1">
                        <li>- Como crear productos y categorias</li>
                        <li>- Como gestionar el inventario</li>
                        <li>- Como usar la caja y turnos</li>
                        <li>- Como ver y actualizar ordenes</li>
                        <li>- Configuracion de pagos</li>
                    </ul>
                </div>
            </div>

            <!-- Messages -->
            <template x-for="msg in messages" :key="msg.id">
                <div class="flex gap-3" :class="msg.role === 'user' ? 'justify-end' : ''">
                    <template x-if="msg.role === 'assistant'">
                        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                        </div>
                    </template>
                    <div class="rounded-lg p-3 max-w-[80%]"
                         :class="msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'">
                        <p class="text-sm whitespace-pre-wrap" x-text="msg.content"></p>
                    </div>
                    <template x-if="msg.role === 'user'">
                        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                    </template>
                </div>
            </template>

            <!-- Loading -->
            <div x-show="loading" class="flex gap-3">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>
                <div class="bg-gray-100 rounded-lg p-3">
                    <p class="text-sm text-gray-500">Pensando...</p>
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t">
            <form @submit.prevent="sendMessage" class="flex gap-3">
                <input type="text" x-model="question" placeholder="Escribe tu pregunta..."
                       class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       :disabled="loading">
                <button type="submit" :disabled="loading || !question.trim()"
                        class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Enviar
                </button>
            </form>
        </div>
    </div>

    <!-- Quick questions -->
    <div class="mt-4">
        <p class="text-sm text-gray-500 mb-2">Preguntas frecuentes:</p>
        <div class="flex flex-wrap gap-2">
            <button @click="askQuestion('Como creo un nuevo producto?')"
                    class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                Como creo un producto?
            </button>
            <button @click="askQuestion('Como funciona la caja?')"
                    class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                Como funciona la caja?
            </button>
            <button @click="askQuestion('Como configuro MercadoPago?')"
                    class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                Configurar MercadoPago
            </button>
            <button @click="askQuestion('Como veo las ordenes del dia?')"
                    class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                Ver ordenes del dia
            </button>
        </div>
    </div>
</div>

<script>
function aiHelper() {
    return {
        question: '',
        messages: [],
        loading: false,
        msgId: 0,

        askQuestion(q) {
            this.question = q;
            this.sendMessage();
        },

        async sendMessage() {
            if (!this.question.trim() || this.loading) return;

            const userQuestion = this.question.trim();
            this.messages.push({ id: ++this.msgId, role: 'user', content: userQuestion });
            this.question = '';
            this.loading = true;

            this.$nextTick(() => {
                document.getElementById('chat-container').scrollTop = 99999;
            });

            try {
                const res = await fetch('{{ route('admin.ai.ask') }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({ pregunta: userQuestion })
                });
                const data = await res.json();

                if (data.error) {
                    this.messages.push({ id: ++this.msgId, role: 'assistant', content: data.message });
                } else {
                    this.messages.push({ id: ++this.msgId, role: 'assistant', content: data.respuesta });
                }
            } catch (e) {
                this.messages.push({ id: ++this.msgId, role: 'assistant', content: 'Error al procesar tu pregunta. Intenta de nuevo.' });
            }

            this.loading = false;
            this.$nextTick(() => {
                document.getElementById('chat-container').scrollTop = 99999;
            });
        }
    }
}
</script>
@endsection

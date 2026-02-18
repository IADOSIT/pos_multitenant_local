<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Iniciar sesion - EMC Abastos</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534' },
          }
        }
      }
    }
  </script>
  <style>
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-white">EMC Abastos</h1>
      <p class="text-primary-100 mt-1">Accede a tu cuenta</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-2xl shadow-2xl p-8">
      @if ($errors->any())
        <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-800">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span class="font-medium">Error de acceso</span>
          </div>
          <ul class="mt-2 text-sm text-red-700 list-disc ml-7">
            @foreach ($errors->all() as $e)
              <li>{{ $e }}</li>
            @endforeach
          </ul>
        </div>
      @endif

      <form method="POST" action="{{ route('login.post') }}" class="space-y-5" id="loginForm">
        @csrf

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Correo electronico</label>
          <div class="relative">
            <input type="email" name="email" id="emailInput" value="{{ old('email') }}" required autofocus
              class="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              placeholder="tu@email.com">
            <svg class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Contrasena</label>
          <div class="relative">
            <input type="password" name="password" required
              class="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              placeholder="">
            <svg class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
        </div>

        <!-- Empresas Selection (hidden by default, shows after email lookup) -->
        <div id="empresasSection" class="hidden fade-in">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Selecciona empresa(s)
            <span id="superadminBadge" class="hidden ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Superadmin</span>
          </label>
          <div id="empresasContainer" class="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            <!-- Empresas will be loaded here via AJAX -->
          </div>
          <p class="text-xs text-gray-500 mt-1">Puedes seleccionar una o varias empresas</p>
        </div>

        <!-- Loading indicator for empresas -->
        <div id="empresasLoading" class="hidden">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando empresas...
          </div>
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="remember" class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
            <span class="text-sm text-gray-600">Recordarme</span>
          </label>
          <a href="{{ route('password.request') }}" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Olvidaste tu contrasena?
          </a>
        </div>

        <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
          </svg>
          Iniciar sesion
        </button>
      </form>

      <div class="mt-6 pt-6 border-t text-center">
        <p class="text-sm text-gray-500">
          No tienes cuenta?
          <a href="{{ route('register') }}" class="text-primary-600 hover:underline font-medium">Registrate aqui</a>
        </p>
      </div>
    </div>

    <!-- Back to Store -->
    <div class="mt-6 text-center">
      <a href="{{ route('store.home') }}" class="text-white/80 hover:text-white text-sm flex items-center justify-center gap-2 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a la tienda
      </a>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const emailInput = document.getElementById('emailInput');
      const empresasSection = document.getElementById('empresasSection');
      const empresasContainer = document.getElementById('empresasContainer');
      const empresasLoading = document.getElementById('empresasLoading');
      const superadminBadge = document.getElementById('superadminBadge');
      const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

      let lastEmail = '';
      let debounceTimer;

      function loadEmpresas(email) {
        if (!email || !email.includes('@') || email === lastEmail) return;
        lastEmail = email;

        empresasLoading.classList.remove('hidden');
        empresasSection.classList.add('hidden');

        fetch('{{ route("login.empresas") }}', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
          empresasLoading.classList.add('hidden');

          if (data.empresas && data.empresas.length > 0) {
            empresasContainer.innerHTML = '';

            // Show superadmin badge if applicable
            if (data.is_superadmin) {
              superadminBadge.classList.remove('hidden');
            } else {
              superadminBadge.classList.add('hidden');
            }

            // Add "Select All" option for superadmin with multiple empresas
            if (data.empresas.length > 1) {
              const selectAllLabel = document.createElement('label');
              selectAllLabel.className = 'flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border-b pb-2 mb-2';
              selectAllLabel.innerHTML = `
                <input type="checkbox" id="selectAllEmpresas" class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
                <span class="text-sm font-medium text-gray-700">Seleccionar todas</span>
              `;
              empresasContainer.appendChild(selectAllLabel);

              document.getElementById('selectAllEmpresas').addEventListener('change', function() {
                const checkboxes = empresasContainer.querySelectorAll('input[name="empresas[]"]');
                checkboxes.forEach(cb => cb.checked = this.checked);
              });
            }

            data.empresas.forEach((empresa, index) => {
              const isUserEmpresa = !data.is_superadmin || (data.user_empresas && data.user_empresas.includes(empresa.id));
              const label = document.createElement('label');
              label.className = 'flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer';
              label.innerHTML = `
                <input type="checkbox" name="empresas[]" value="${empresa.id}"
                       class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                       ${index === 0 ? 'checked' : ''}>
                <div class="flex items-center gap-2 flex-1">
                  ${empresa.logo_url
                    ? `<img src="${empresa.logo_url}" alt="" class="w-8 h-8 rounded-full object-cover">`
                    : `<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">${empresa.nombre.charAt(0)}</div>`
                  }
                  <div>
                    <span class="text-sm text-gray-700">${empresa.nombre}</span>
                    ${isUserEmpresa && data.is_superadmin ? '<span class="ml-1 text-xs text-purple-500">(asignada)</span>' : ''}
                  </div>
                </div>
              `;
              empresasContainer.appendChild(label);
            });

            empresasSection.classList.remove('hidden');
          } else {
            empresasSection.classList.add('hidden');
          }
        })
        .catch(error => {
          console.error('Error loading empresas:', error);
          empresasLoading.classList.add('hidden');
        });
      }

      // Load empresas when email changes (with debounce)
      emailInput.addEventListener('blur', function() {
        loadEmpresas(this.value.trim());
      });

      emailInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (this.value.includes('@') && this.value.includes('.')) {
            loadEmpresas(this.value.trim());
          }
        }, 800);
      });

      // Load empresas if email is pre-filled
      if (emailInput.value) {
        loadEmpresas(emailInput.value.trim());
      }
    });
  </script>
</body>
</html>

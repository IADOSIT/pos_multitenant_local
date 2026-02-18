@extends('layouts.admin', ['title'=>'Dashboard','header'=>'Dashboard'])

@section('content')
<div x-data="dashboardChart()" x-init="initChart()">
  <!-- Main KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Ventas Hoy -->
    <div class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Ventas Hoy</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">${{ number_format($kpis['ventas_hoy'], 2) }}</p>
        </div>
        <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <span class="text-primary-600 font-medium">{{ $kpis['ordenes_hoy'] }}</span> órdenes
      </div>
    </div>

    <!-- Ventas Semana -->
    <div class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Ventas Semana</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">${{ number_format($kpis['ventas_semana'], 2) }}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <span class="text-blue-600 font-medium">{{ $kpis['ordenes_semana'] }}</span> órdenes
      </div>
    </div>

    <!-- Ventas Mes -->
    <div class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Ventas Mes</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">${{ number_format($kpis['ventas_mes'], 2) }}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <span class="text-purple-600 font-medium">{{ $kpis['ordenes_mes'] }}</span> órdenes
      </div>
    </div>

    <!-- Ticket Promedio -->
    <div class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Ticket Promedio</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">${{ number_format($kpis['ticket_promedio_mes'], 2) }}</p>
        </div>
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/>
          </svg>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        Hoy: <span class="text-amber-600 font-medium">${{ number_format($kpis['ticket_promedio_hoy'], 2) }}</span>
      </div>
    </div>
  </div>

  <!-- Alerts Section -->
  @if(isset($alerts) && $alerts['total_alerts'] > 0)
  <div class="bg-white rounded-xl shadow-sm border p-4 mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-bold text-gray-700 flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        Alertas del sistema
      </h2>
      <span class="px-2.5 py-1 text-xs font-bold rounded-full {{ $alerts['critical'] > 0 ? 'bg-red-100 text-red-700' : ($alerts['warning'] > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700') }}">
        {{ $alerts['total_alerts'] }} alerta{{ $alerts['total_alerts'] != 1 ? 's' : '' }}
      </span>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      @foreach($alerts['alerts'] as $alert)
        @if($alert['count'] > 0)
        <a href="{{ route($alert['route']) }}" class="flex items-center gap-3 p-3 rounded-lg border transition
          {{ $alert['level'] === 'critical' ? 'border-red-200 bg-red-50 hover:bg-red-100' :
             ($alert['level'] === 'warning' ? 'border-amber-200 bg-amber-50 hover:bg-amber-100' : 'border-gray-200 hover:bg-gray-50') }}">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            {{ $alert['level'] === 'critical' ? 'bg-red-200 text-red-700' :
               ($alert['level'] === 'warning' ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-600') }}">
            @if($alert['icon'] === 'package')
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            @elseif($alert['icon'] === 'shopping-cart')
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            @elseif($alert['icon'] === 'truck')
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
            @elseif($alert['icon'] === 'dollar-sign')
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            @endif
          </div>
          <div class="min-w-0">
            <p class="font-bold text-sm {{ $alert['level'] === 'critical' ? 'text-red-800' : ($alert['level'] === 'warning' ? 'text-amber-800' : 'text-gray-800') }}">
              {{ $alert['count'] }}
            </p>
            <p class="text-xs truncate {{ $alert['level'] === 'critical' ? 'text-red-600' : ($alert['level'] === 'warning' ? 'text-amber-600' : 'text-gray-500') }}">
              {{ $alert['title'] }}
            </p>
          </div>
        </a>
        @endif
      @endforeach
    </div>
  </div>
  @endif

  <!-- Secondary KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <!-- Pendientes -->
    <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-4 text-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold">{{ $kpis['pendientes'] }}</p>
          <p class="text-xs text-orange-100">Pendientes</p>
        </div>
      </div>
    </div>

    <!-- Entregadas -->
    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-4 text-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold">{{ $kpis['entregadas'] }}</p>
          <p class="text-xs text-green-100">Entregadas hoy</p>
        </div>
      </div>
    </div>

    <!-- Productos -->
    <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm p-4 text-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold">{{ $kpis['productos_activos'] }}</p>
          <p class="text-xs text-indigo-100">Productos activos</p>
        </div>
      </div>
    </div>

    <!-- Clientes -->
    <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-sm p-4 text-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold">{{ $kpis['clientes'] }}</p>
          <p class="text-xs text-pink-100">Clientes</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Sales Chart -->
    <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Ventas por día</h2>
        <div class="flex gap-2">
          <button @click="loadChart(7)" :class="days === 7 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-sm font-medium rounded-lg transition">7 días</button>
          <button @click="loadChart(14)" :class="days === 14 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-sm font-medium rounded-lg transition">14 días</button>
          <button @click="loadChart(30)" :class="days === 30 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-sm font-medium rounded-lg transition">30 días</button>
        </div>
      </div>
      <div class="relative h-72" x-show="!loading">
        <canvas id="salesChart"></canvas>
      </div>
      <div class="h-72 flex items-center justify-center" x-show="loading" x-cloak>
        <div class="animate-pulse flex flex-col items-center gap-2">
          <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span class="text-sm text-gray-500">Cargando...</span>
        </div>
      </div>
    </div>

    <!-- Latest Orders -->
    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Últimas órdenes</h2>
        <a href="{{ route('ops.ordenes.hoy') }}" class="text-sm text-primary-600 hover:text-primary-700 font-medium">Ver todas</a>
      </div>
      <div class="space-y-3">
        @forelse($ultimasOrdenes as $o)
          <div class="flex items-center justify-between py-2 border-b last:border-0">
            <div class="min-w-0">
              <p class="font-medium text-gray-800 truncate">{{ $o->folio ?? '#'.$o->id }}</p>
              <p class="text-xs text-gray-500">
                @php
                  $statusColors = [
                    'pendiente' => 'text-orange-600',
                    'preparando' => 'text-blue-600',
                    'listo' => 'text-indigo-600',
                    'entregado' => 'text-green-600',
                    'cancelado' => 'text-red-600',
                  ];
                @endphp
                <span class="{{ $statusColors[$o->status] ?? 'text-gray-600' }}">{{ ucfirst($o->status) }}</span>
                · {{ $o->created_at->format('d/m H:i') }}
              </p>
            </div>
            <p class="font-bold text-gray-900">${{ number_format($o->total, 2) }}</p>
          </div>
        @empty
          <p class="text-center text-gray-500 py-8">No hay órdenes recientes</p>
        @endforelse
      </div>
    </div>
  </div>

  <!-- Quick Links -->
  <div class="mt-6 bg-white rounded-xl shadow-sm border p-6">
    <h2 class="text-lg font-bold text-gray-800 mb-4">Accesos rápidos</h2>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <a href="{{ route('admin.productos.index') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Productos</span>
      </a>

      <a href="{{ route('admin.categorias.index') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Categorías</span>
      </a>

      <a href="{{ route('admin.caja.index') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Caja</span>
      </a>

      <a href="{{ route('ops.ordenes.hoy') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Órdenes hoy</span>
      </a>

      <a href="{{ route('admin.whatsapp.index') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">WhatsApp</span>
      </a>

      <a href="{{ route('admin.inventarios.index') }}" class="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition group">
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Inventario</span>
      </a>
    </div>
  </div>
</div>

<script>
function dashboardChart() {
  return {
    chart: null,
    days: 7,
    loading: false,
    chartData: @json($chartData),

    initChart() {
      this.renderChart();
    },

    async loadChart(days) {
      this.days = days;
      this.loading = true;

      try {
        const response = await fetch(`/admin/chart-data?days=${days}`);
        this.chartData = await response.json();
        this.renderChart();
      } catch (error) {
        console.error('Error loading chart:', error);
      } finally {
        this.loading = false;
      }
    },

    renderChart() {
      const ctx = document.getElementById('salesChart').getContext('2d');

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.chartData.labels,
          datasets: [{
            label: 'Ventas ($)',
            data: this.chartData.totals,
            backgroundColor: 'rgba(22, 163, 74, 0.8)',
            borderColor: 'rgb(22, 163, 74)',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 14 },
              bodyFont: { size: 13 },
              callbacks: {
                label: function(context) {
                  return '$' + context.raw.toLocaleString('es-MX', { minimumFractionDigits: 2 });
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString('es-MX');
                }
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }
}
</script>
@endsection

@extends('layouts.admin', ['title'=>'Agregar WhatsApp','header'=>'Agregar WhatsApp'])

@section('content')
<div class="bg-white border rounded p-4">
  <form method="POST" action="{{ route('admin.whatsapp.store') }}" class="space-y-3">
    @csrf
    <div>
      <label class="text-xs text-gray-500">Número WhatsApp</label>
      <input name="whatsapp" value="{{ old('whatsapp') }}" class="w-full mt-1 border rounded px-3 py-2" placeholder="+52 81...">
      @error('whatsapp')<div class="text-xs text-red-600 mt-1">{{ $message }}</div>@enderror
    </div>
    <label class="inline-flex items-center gap-2">
      <input type="hidden" name="activo" value="0">
      <input type="checkbox" name="activo" value="1" checked>
      <span class="text-sm">Activo</span>
    </label>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded bg-black text-white">Guardar</button>
      <a href="{{ route('admin.whatsapp.index') }}" class="px-4 py-2 rounded border">Cancelar</a>
    </div>
  </form>
</div>
@endsection

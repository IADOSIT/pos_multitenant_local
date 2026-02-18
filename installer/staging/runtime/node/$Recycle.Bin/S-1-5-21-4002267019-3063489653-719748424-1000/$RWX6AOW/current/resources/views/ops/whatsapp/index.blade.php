@extends('layouts.admin', ['title'=>'WhatsApp Logs', 'header'=>'WhatsApp Logs'])
@section('content')
<div class="flex items-center justify-between mb-4">
  <div>
    <div class="text-lg font-bold">WhatsApp Logs</div>
    <div class="text-xs text-gray-500">Reintenta fallidos o revisa “skipped”.</div>
  </div>
  <form method="GET" class="flex gap-2">
    <select name="status" class="border rounded px-3 py-2">
      <option value="">Status (todos)</option>
      <option value="sent" @selected(request('status')==='sent')>sent</option>
      <option value="failed" @selected(request('status')==='failed')>failed</option>
      <option value="skipped" @selected(request('status')==='skipped')>skipped</option>
    </select>
    <button class="px-4 py-2 bg-gray-900 text-white rounded">Filtrar</button>
  </form>
</div>

<div class="bg-white border rounded overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="text-left p-3">Fecha</th>
        <th class="text-left p-3">Evento</th>
        <th class="text-left p-3">To</th>
        <th class="text-left p-3">Status</th>
        <th class="text-left p-3">Skipped</th>
        <th class="p-3"></th>
      </tr>
    </thead>
    <tbody class="divide-y">
      @foreach($logs as $l)
        <tr>
          <td class="p-3 text-xs text-gray-500">{{ $l->created_at }}</td>
          <td class="p-3">{{ $l->evento }}</td>
          <td class="p-3">{{ $l->to_whatsapp }}</td>
          <td class="p-3">{{ $l->status }}</td>
          <td class="p-3 text-xs">{{ $l->skipped_reason }}</td>
          <td class="p-3 text-right">
            @if($l->status==='failed')
              <form method="POST" action="{{ route('ops.whatsapp.retry',$l->id) }}" class="inline">
                @csrf
                <button class="text-blue-700 hover:underline">Reintentar</button>
              </form>
            @endif
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>
</div>

<div class="mt-4">{{ $logs->links() }}</div>
@endsection

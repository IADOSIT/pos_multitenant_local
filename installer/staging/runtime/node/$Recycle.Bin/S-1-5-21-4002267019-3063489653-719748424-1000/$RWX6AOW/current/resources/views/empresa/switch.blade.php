@extends('layouts.app')

@section('content')
<div class="card" style="max-width:640px;margin:0 auto">
  <h2>Selecciona empresa</h2>
  <form method="POST" action="{{ route('empresa.set') }}">
    @csrf
    <select class="input" name="empresa_id">
      @foreach($empresas as $e)
        <option value="{{ $e->id }}">{{ $e->nombre }}</option>
      @endforeach
    </select>
    <br><br>
    <button class="btn" type="submit">Usar empresa</button>
  </form>
</div>
@endsection

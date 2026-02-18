@extends('layouts.app')

@section('content')
  <div class="card">
    <h1>EMC Abastos</h1>
    <p class="muted">Sistema cargado correctamente.</p>
    @guest
      <a class="btn" href="{{ route('login') }}">Entrar</a>
    @else
      <a class="btn" href="{{ route('dashboard') }}">Ir al dashboard</a>
    @endguest
  </div>
@endsection

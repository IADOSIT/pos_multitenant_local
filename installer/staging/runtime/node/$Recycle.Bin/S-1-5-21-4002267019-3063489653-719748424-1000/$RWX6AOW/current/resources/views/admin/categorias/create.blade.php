@extends('layouts.admin', ['title'=>'Nueva categoría','header'=>'Nueva categoría'])
@section('content')
<div class="bg-white border rounded p-4">
  <form method="POST" action="{{ route('admin.categorias.store') }}">
    @include('admin.categorias.form', ['categoria'=>null])
  </form>
</div>
@endsection

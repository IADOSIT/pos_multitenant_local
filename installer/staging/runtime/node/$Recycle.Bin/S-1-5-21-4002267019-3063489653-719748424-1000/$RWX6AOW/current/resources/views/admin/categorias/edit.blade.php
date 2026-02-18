@extends('layouts.admin', ['title'=>'Editar categoría','header'=>'Editar categoría'])
@section('content')
<div class="bg-white border rounded p-4">
  <form method="POST" action="{{ route('admin.categorias.update',$categoria->id) }}">
    @method('PUT')
    @include('admin.categorias.form')
  </form>
</div>
@endsection

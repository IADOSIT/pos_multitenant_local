<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\Import;
use App\Models\Inventario;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;

class ImportExportController extends Controller
{
    // ======================
    // HUB (unified view)
    // ======================

    public function hub(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $imports = Import::where('empresa_id', $empresaId)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $empresas = $this->getEmpresasForUser();

        return view('admin.import-export.hub', compact('imports', 'empresas', 'empresaId'));
    }

    public function history(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $imports = Import::where('empresa_id', $empresaId)
            ->orderByDesc('created_at')
            ->paginate(30);

        $empresas = $this->getEmpresasForUser();

        return view('admin.import-export.history', compact('imports', 'empresas', 'empresaId'));
    }

    // ======================
    // PRODUCTS IMPORT/EXPORT
    // ======================

    public function productosIndex(Request $request)
    {
        $empresas = $this->getEmpresasForUser();
        $empresaId = $this->resolveEmpresaId($request);
        return view('admin.import-export.productos', compact('empresas', 'empresaId'));
    }

    public function productosTemplate()
    {
        $headers = ['sku', 'nombre', 'descripcion', 'precio', 'unidad', 'categoria_nombre', 'activo'];

        $csv = "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
        $csv .= implode(',', $headers) . "\n";
        $csv .= "SKU001,Producto Ejemplo,Descripcion del producto,99.99,kg,Frutas,1\n";
        $csv .= "SKU002,Otro Producto,Otra descripcion,149.50,pza,Verduras,1\n";
        $csv .= ",Producto Sin SKU,Solo nombre y precio,25.00,,Lacteos,1\n";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_productos.csv"',
        ]);
    }

    public function productosPreview(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        $rows = [];
        $errors = [];

        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            $headers = fgetcsv($handle);

            // Strip BOM from first header
            if ($headers) {
                $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            }

            if (!$headers || !in_array('nombre', array_map('strtolower', $headers))) {
                return back()->withErrors(['file' => 'El archivo debe contener al menos la columna "nombre".']);
            }

            $headers = array_map('strtolower', array_map('trim', $headers));
            $lineNum = 1;

            while (($data = fgetcsv($handle)) !== false) {
                $lineNum++;
                if (count($data) !== count($headers)) {
                    $errors[] = "Linea {$lineNum}: Numero de columnas incorrecto.";
                    continue;
                }

                $row = array_combine($headers, $data);
                $row['_line'] = $lineNum;
                $row['_errors'] = [];

                if (empty(trim($row['nombre'] ?? ''))) {
                    $row['_errors'][] = 'Nombre requerido';
                }
                if (!empty($row['precio']) && !is_numeric($row['precio'])) {
                    $row['_errors'][] = 'Precio debe ser numerico';
                }

                $rows[] = $row;
            }
            fclose($handle);
        }

        $categorias = Categoria::where('empresa_id', $empresaId)
            ->pluck('id', 'nombre')
            ->toArray();

        session([
            'import_preview' => $rows,
            'import_categorias' => $categorias,
            'import_type' => 'productos',
            'import_empresa_id' => $empresaId,
        ]);

        $validRows = array_filter($rows, fn($r) => empty($r['_errors']));
        $invalidRows = array_filter($rows, fn($r) => !empty($r['_errors']));

        return view('admin.import-export.productos-preview', compact('rows', 'validRows', 'invalidRows', 'errors', 'categorias'));
    }

    public function productosImport(Request $request)
    {
        $empresaId = (int) session('import_empresa_id', session('empresa_id'));
        $rows = session('import_preview', []);
        $categoriasMap = session('import_categorias', []);

        if (empty($rows)) {
            return redirect()->route('admin.import-export.productos')
                ->withErrors(['file' => 'No hay datos para importar. Por favor sube el archivo nuevamente.']);
        }

        $import = Import::create([
            'tipo' => 'productos',
            'empresa_id' => $empresaId,
            'usuario_id' => auth()->id(),
            'archivo' => 'productos_upload.csv',
            'status' => 'processing',
            'total_rows' => count($rows),
            'started_at' => now(),
        ]);

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $errorDetails = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (!empty($row['_errors'])) {
                    $skipped++;
                    continue;
                }

                $nombre = trim($row['nombre'] ?? '');
                if (empty($nombre)) {
                    $skipped++;
                    continue;
                }

                $sku = trim($row['sku'] ?? '');
                $producto = null;

                if (!empty($sku)) {
                    $producto = Producto::where('empresa_id', $empresaId)
                        ->where('sku', $sku)
                        ->first();
                }

                if (!$producto) {
                    $producto = Producto::where('empresa_id', $empresaId)
                        ->where('nombre', $nombre)
                        ->first();
                }

                $isNew = !$producto;

                if ($isNew) {
                    $producto = new Producto();
                    $producto->empresa_id = $empresaId;
                }

                $producto->nombre = $nombre;
                $producto->sku = $sku ?: null;
                $producto->descripcion = trim($row['descripcion'] ?? '') ?: null;
                $producto->precio = (float) ($row['precio'] ?? 0);
                $producto->activo = $this->parseBool($row['activo'] ?? '1');

                if (isset($row['unidad'])) {
                    $producto->unidad = trim($row['unidad']) ?: null;
                }

                // Map categoria
                $catName = trim($row['categoria_nombre'] ?? '');
                if (!empty($catName)) {
                    $catId = null;
                    foreach ($categoriasMap as $name => $id) {
                        if (strtolower($name) === strtolower($catName)) {
                            $catId = $id;
                            break;
                        }
                    }
                    if (!$catId) {
                        // Auto-create category
                        $cat = Categoria::create([
                            'empresa_id' => $empresaId,
                            'nombre' => $catName,
                            'slug' => Str::slug($catName),
                            'activa' => true,
                        ]);
                        $catId = $cat->id;
                        $categoriasMap[$catName] = $catId;
                    }
                    $producto->categoria_id = $catId;
                }

                $producto->save();

                if ($isNew) {
                    $imported++;
                } else {
                    $updated++;
                }
            }

            DB::commit();

            $import->update([
                'status' => 'completed',
                'imported' => $imported,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors' => count($errorDetails),
                'error_details' => $errorDetails ?: null,
                'finished_at' => now(),
            ]);

            session()->forget(['import_preview', 'import_categorias', 'import_type', 'import_empresa_id']);

            return redirect()->route('admin.productos.index')
                ->with('ok', "Importacion completada: {$imported} nuevos, {$updated} actualizados, {$skipped} omitidos.");

        } catch (\Exception $e) {
            DB::rollBack();

            $import->update([
                'status' => 'failed',
                'error_details' => [$e->getMessage()],
                'finished_at' => now(),
            ]);

            return redirect()->route('admin.import-export.productos')
                ->withErrors(['file' => 'Error durante la importacion: ' . $e->getMessage()]);
        }
    }

    public function productosExport(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $productos = Producto::where('empresa_id', $empresaId)
            ->with('categoria')
            ->orderBy('nombre')
            ->get();

        $headers = ['sku', 'nombre', 'descripcion', 'precio', 'unidad', 'categoria_nombre', 'activo'];
        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";

        foreach ($productos as $p) {
            $csv .= $this->csvEncode($p->sku) . ',';
            $csv .= $this->csvEncode($p->nombre) . ',';
            $csv .= $this->csvEncode($p->descripcion) . ',';
            $csv .= number_format($p->precio, 2, '.', '') . ',';
            $csv .= $this->csvEncode($p->unidad) . ',';
            $csv .= $this->csvEncode($p->categoria?->nombre) . ',';
            $csv .= ($p->activo ? '1' : '0') . "\n";
        }

        $filename = 'productos_' . date('Y-m-d_His') . '.csv';

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ======================
    // CATEGORIES IMPORT/EXPORT
    // ======================

    public function categoriasIndex(Request $request)
    {
        $empresas = $this->getEmpresasForUser();
        $empresaId = $this->resolveEmpresaId($request);
        return view('admin.import-export.categorias', compact('empresas', 'empresaId'));
    }

    public function categoriasTemplate()
    {
        $headers = ['nombre', 'descripcion', 'orden', 'activo'];

        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";
        $csv .= "Frutas,Frutas frescas y de temporada,1,1\n";
        $csv .= "Verduras,Verduras de alta calidad,2,1\n";
        $csv .= "Lacteos,Leche y derivados,3,1\n";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_categorias.csv"',
        ]);
    }

    public function categoriasExport(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $categorias = Categoria::where('empresa_id', $empresaId)
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get();

        $headers = ['nombre', 'descripcion', 'orden', 'activo'];
        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";

        foreach ($categorias as $c) {
            $csv .= $this->csvEncode($c->nombre) . ',';
            $csv .= $this->csvEncode($c->descripcion) . ',';
            $csv .= ($c->orden ?? 0) . ',';
            $csv .= ($c->activa ? '1' : '0') . "\n";
        }

        $filename = 'categorias_' . date('Y-m-d_His') . '.csv';

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function categoriasImport(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $file = $request->file('file');

        $import = Import::create([
            'tipo' => 'categorias',
            'empresa_id' => $empresaId,
            'usuario_id' => auth()->id(),
            'archivo' => $file->getClientOriginalName(),
            'status' => 'processing',
            'started_at' => now(),
        ]);

        $imported = 0;
        $updated = 0;
        $totalRows = 0;

        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            $headers = fgetcsv($handle);
            if ($headers) {
                $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            }
            $headers = array_map('strtolower', array_map('trim', $headers));

            while (($data = fgetcsv($handle)) !== false) {
                if (count($data) !== count($headers)) continue;

                $row = array_combine($headers, $data);
                $nombre = trim($row['nombre'] ?? '');

                if (empty($nombre)) continue;
                $totalRows++;

                $cat = Categoria::where('empresa_id', $empresaId)
                    ->where('nombre', $nombre)
                    ->first();

                $isNew = !$cat;

                if ($isNew) {
                    $cat = new Categoria();
                    $cat->empresa_id = $empresaId;
                }

                $cat->nombre = $nombre;
                $cat->slug = Str::slug($nombre);
                $cat->descripcion = trim($row['descripcion'] ?? '') ?: null;
                $cat->orden = (int) ($row['orden'] ?? 0);
                $cat->activa = $this->parseBool($row['activo'] ?? '1');
                $cat->save();

                if ($isNew) {
                    $imported++;
                } else {
                    $updated++;
                }
            }
            fclose($handle);
        }

        $import->update([
            'status' => 'completed',
            'total_rows' => $totalRows,
            'imported' => $imported,
            'updated' => $updated,
            'finished_at' => now(),
        ]);

        return redirect()->route('admin.categorias.index')
            ->with('ok', "Importacion completada: {$imported} nuevas, {$updated} actualizadas.");
    }

    // ======================
    // CLIENTS IMPORT/EXPORT
    // ======================

    public function clientesIndex(Request $request)
    {
        $empresas = $this->getEmpresasForUser();
        $empresaId = $this->resolveEmpresaId($request);
        return view('admin.import-export.clientes', compact('empresas', 'empresaId'));
    }

    public function clientesTemplate()
    {
        $headers = ['nombre', 'whatsapp', 'email', 'enviar_estatus'];

        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";
        $csv .= "Juan Perez,5215512345678,juan@email.com,1\n";
        $csv .= "Maria Lopez,5215598765432,maria@email.com,1\n";
        $csv .= "Carlos Garcia,5215511112222,,0\n";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_clientes.csv"',
        ]);
    }

    public function clientesPreview(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        $rows = [];
        $errors = [];

        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            $headers = fgetcsv($handle);
            if ($headers) {
                $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            }

            if (!$headers || !in_array('nombre', array_map('strtolower', $headers))) {
                return back()->withErrors(['file' => 'El archivo debe contener al menos la columna "nombre".']);
            }

            $headers = array_map('strtolower', array_map('trim', $headers));
            $lineNum = 1;

            while (($data = fgetcsv($handle)) !== false) {
                $lineNum++;
                if (count($data) !== count($headers)) {
                    $errors[] = "Linea {$lineNum}: Numero de columnas incorrecto.";
                    continue;
                }

                $row = array_combine($headers, $data);
                $row['_line'] = $lineNum;
                $row['_errors'] = [];

                if (empty(trim($row['nombre'] ?? ''))) {
                    $row['_errors'][] = 'Nombre requerido';
                }
                if (empty(trim($row['whatsapp'] ?? ''))) {
                    $row['_errors'][] = 'WhatsApp requerido';
                }
                $email = trim($row['email'] ?? '');
                if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $row['_errors'][] = 'Email invalido';
                }

                $rows[] = $row;
            }
            fclose($handle);
        }

        session([
            'import_preview' => $rows,
            'import_type' => 'clientes',
            'import_empresa_id' => $empresaId,
        ]);

        $validRows = array_filter($rows, fn($r) => empty($r['_errors']));
        $invalidRows = array_filter($rows, fn($r) => !empty($r['_errors']));

        return view('admin.import-export.clientes-preview', compact('rows', 'validRows', 'invalidRows', 'errors'));
    }

    public function clientesImport(Request $request)
    {
        $empresaId = (int) session('import_empresa_id', session('empresa_id'));
        $rows = session('import_preview', []);

        if (empty($rows)) {
            return redirect()->route('admin.import-export.clientes')
                ->withErrors(['file' => 'No hay datos para importar. Por favor sube el archivo nuevamente.']);
        }

        $import = Import::create([
            'tipo' => 'clientes',
            'empresa_id' => $empresaId,
            'usuario_id' => auth()->id(),
            'archivo' => 'clientes_upload.csv',
            'status' => 'processing',
            'total_rows' => count($rows),
            'started_at' => now(),
        ]);

        $imported = 0;
        $updated = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (!empty($row['_errors'])) {
                    $skipped++;
                    continue;
                }

                $nombre = trim($row['nombre'] ?? '');
                $whatsapp = trim($row['whatsapp'] ?? '');
                if (empty($nombre) || empty($whatsapp)) {
                    $skipped++;
                    continue;
                }

                // Find by whatsapp within empresa
                $cliente = Cliente::where('empresa_id', $empresaId)
                    ->where('whatsapp', $whatsapp)
                    ->first();

                $isNew = !$cliente;

                if ($isNew) {
                    $cliente = new Cliente();
                    $cliente->empresa_id = $empresaId;
                }

                $cliente->nombre = $nombre;
                $cliente->whatsapp = $whatsapp;
                $email = trim($row['email'] ?? '');
                if (!empty($email)) {
                    $cliente->email = $email;
                }
                $cliente->enviar_estatus = $this->parseBool($row['enviar_estatus'] ?? '1');
                $cliente->save();

                if ($isNew) {
                    $imported++;
                } else {
                    $updated++;
                }
            }

            DB::commit();

            $import->update([
                'status' => 'completed',
                'imported' => $imported,
                'updated' => $updated,
                'skipped' => $skipped,
                'finished_at' => now(),
            ]);

            session()->forget(['import_preview', 'import_type', 'import_empresa_id']);

            return redirect()->route('admin.clientes.index')
                ->with('ok', "Importacion completada: {$imported} nuevos, {$updated} actualizados, {$skipped} omitidos.");

        } catch (\Exception $e) {
            DB::rollBack();

            $import->update([
                'status' => 'failed',
                'error_details' => [$e->getMessage()],
                'finished_at' => now(),
            ]);

            return redirect()->route('admin.import-export.clientes')
                ->withErrors(['file' => 'Error durante la importacion: ' . $e->getMessage()]);
        }
    }

    public function clientesExport(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $clientes = Cliente::where('empresa_id', $empresaId)
            ->orderBy('nombre')
            ->get();

        $headers = ['nombre', 'whatsapp', 'email', 'enviar_estatus'];
        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";

        foreach ($clientes as $c) {
            $csv .= $this->csvEncode($c->nombre) . ',';
            $csv .= $this->csvEncode($c->whatsapp) . ',';
            $csv .= $this->csvEncode($c->email) . ',';
            $csv .= ($c->enviar_estatus ? '1' : '0') . "\n";
        }

        $filename = 'clientes_' . date('Y-m-d_His') . '.csv';

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ======================
    // INVENTORY IMPORT/EXPORT
    // ======================

    public function inventarioIndex(Request $request)
    {
        $empresas = $this->getEmpresasForUser();
        $empresaId = $this->resolveEmpresaId($request);
        return view('admin.import-export.inventario', compact('empresas', 'empresaId'));
    }

    public function inventarioTemplate()
    {
        $headers = ['sku', 'nombre_producto', 'stock'];

        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";
        $csv .= "SKU001,Producto Ejemplo,50\n";
        $csv .= "SKU002,Otro Producto,100\n";
        $csv .= ",Producto por nombre,25\n";

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_inventario.csv"',
        ]);
    }

    public function inventarioPreview(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        $rows = [];
        $errors = [];

        // Preload products for matching
        $productosBySku = Producto::where('empresa_id', $empresaId)
            ->whereNotNull('sku')
            ->pluck('id', 'sku')
            ->toArray();
        $productosByName = Producto::where('empresa_id', $empresaId)
            ->pluck('id', 'nombre')
            ->toArray();

        if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
            $headers = fgetcsv($handle);
            if ($headers) {
                $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            }

            $headers = array_map('strtolower', array_map('trim', $headers));
            $lineNum = 1;

            while (($data = fgetcsv($handle)) !== false) {
                $lineNum++;
                if (count($data) !== count($headers)) {
                    $errors[] = "Linea {$lineNum}: Numero de columnas incorrecto.";
                    continue;
                }

                $row = array_combine($headers, $data);
                $row['_line'] = $lineNum;
                $row['_errors'] = [];

                $sku = trim($row['sku'] ?? '');
                $nombre = trim($row['nombre_producto'] ?? '');
                $stock = trim($row['stock'] ?? '');

                if (empty($sku) && empty($nombre)) {
                    $row['_errors'][] = 'SKU o nombre_producto requerido';
                }
                if ($stock === '' || !is_numeric($stock)) {
                    $row['_errors'][] = 'Stock debe ser numerico';
                }

                // Try matching product
                $productoId = null;
                if (!empty($sku) && isset($productosBySku[$sku])) {
                    $productoId = $productosBySku[$sku];
                } elseif (!empty($nombre) && isset($productosByName[$nombre])) {
                    $productoId = $productosByName[$nombre];
                }

                if (!$productoId && empty($row['_errors'])) {
                    $row['_errors'][] = 'Producto no encontrado';
                }

                $row['_producto_id'] = $productoId;
                $rows[] = $row;
            }
            fclose($handle);
        }

        session([
            'import_preview' => $rows,
            'import_type' => 'inventario',
            'import_empresa_id' => $empresaId,
        ]);

        $validRows = array_filter($rows, fn($r) => empty($r['_errors']));
        $invalidRows = array_filter($rows, fn($r) => !empty($r['_errors']));

        return view('admin.import-export.inventario-preview', compact('rows', 'validRows', 'invalidRows', 'errors'));
    }

    public function inventarioImport(Request $request)
    {
        $empresaId = (int) session('import_empresa_id', session('empresa_id'));
        $rows = session('import_preview', []);

        if (empty($rows)) {
            return redirect()->route('admin.import-export.inventario')
                ->withErrors(['file' => 'No hay datos para importar. Por favor sube el archivo nuevamente.']);
        }

        $import = Import::create([
            'tipo' => 'inventario',
            'empresa_id' => $empresaId,
            'usuario_id' => auth()->id(),
            'archivo' => 'inventario_upload.csv',
            'status' => 'processing',
            'total_rows' => count($rows),
            'started_at' => now(),
        ]);

        $imported = 0;
        $updated = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (!empty($row['_errors']) || empty($row['_producto_id'])) {
                    $skipped++;
                    continue;
                }

                $productoId = (int) $row['_producto_id'];
                $stock = (int) $row['stock'];

                $inv = Inventario::where('empresa_id', $empresaId)
                    ->where('producto_id', $productoId)
                    ->first();

                if ($inv) {
                    $inv->stock = $stock;
                    $inv->save();
                    $updated++;
                } else {
                    Inventario::create([
                        'empresa_id' => $empresaId,
                        'producto_id' => $productoId,
                        'stock' => $stock,
                    ]);
                    $imported++;
                }
            }

            DB::commit();

            $import->update([
                'status' => 'completed',
                'imported' => $imported,
                'updated' => $updated,
                'skipped' => $skipped,
                'finished_at' => now(),
            ]);

            session()->forget(['import_preview', 'import_type', 'import_empresa_id']);

            return redirect()->route('admin.inventarios.index')
                ->with('ok', "Importacion completada: {$imported} nuevos, {$updated} actualizados, {$skipped} omitidos.");

        } catch (\Exception $e) {
            DB::rollBack();

            $import->update([
                'status' => 'failed',
                'error_details' => [$e->getMessage()],
                'finished_at' => now(),
            ]);

            return redirect()->route('admin.import-export.inventario')
                ->withErrors(['file' => 'Error durante la importacion: ' . $e->getMessage()]);
        }
    }

    public function inventarioExport(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $inventarios = Inventario::where('empresa_id', $empresaId)
            ->with('producto')
            ->get();

        $headers = ['sku', 'nombre_producto', 'stock'];
        $csv = "\xEF\xBB\xBF" . implode(',', $headers) . "\n";

        foreach ($inventarios as $inv) {
            $csv .= $this->csvEncode($inv->producto?->sku) . ',';
            $csv .= $this->csvEncode($inv->producto?->nombre) . ',';
            $csv .= $inv->stock . "\n";
        }

        $filename = 'inventario_' . date('Y-m-d_His') . '.csv';

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ======================
    // HELPERS
    // ======================

    private function csvEncode($value): string
    {
        if ($value === null) return '';

        $value = str_replace('"', '""', $value);

        if (str_contains($value, ',') || str_contains($value, '"') || str_contains($value, "\n")) {
            return '"' . $value . '"';
        }

        return $value;
    }

    private function parseBool(string $value): bool
    {
        return in_array(strtolower(trim($value)), ['1', 'true', 'si', 'yes', 'activo', 'sí']);
    }

    /**
     * Resolve which empresa_id to use.
     * Superadmin can override via ?empresa_id= query param.
     */
    private function resolveEmpresaId(Request $request): int
    {
        $user = auth()->user();
        $sessionEmpresaId = (int) session('empresa_id');

        if ($user->isSuperAdmin() && $request->filled('empresa_id')) {
            return (int) $request->input('empresa_id');
        }

        return $sessionEmpresaId;
    }

    /**
     * Get empresas list for superadmin selector.
     * Returns null for non-superadmin users.
     */
    private function getEmpresasForUser(): ?object
    {
        $user = auth()->user();
        if ($user->isSuperAdmin()) {
            return Empresa::where('activa', true)->orderBy('nombre')->get();
        }
        return null;
    }
}

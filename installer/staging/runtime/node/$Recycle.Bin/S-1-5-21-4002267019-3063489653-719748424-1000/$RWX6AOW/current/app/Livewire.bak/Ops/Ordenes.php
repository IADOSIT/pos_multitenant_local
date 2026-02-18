<?php

namespace App\Livewire\Ops;

use App\Models\Orden;
use Livewire\Component;
use Livewire\WithPagination;
use Carbon\Carbon;

class Ordenes extends Component
{
    use WithPagination;

    public $search = '';
    public $filterStatus = '';
    public $filterDate = '';
    public $dateFrom = '';
    public $dateTo = '';

    protected $queryString = ['search', 'filterStatus', 'filterDate'];

    public function mount()
    {
        $this->filterDate = 'hoy';
    }

    public function updatedSearch()
    {
        $this->resetPage();
    }

    public function updatedFilterStatus()
    {
        $this->resetPage();
    }

    public function updatedFilterDate()
    {
        $this->resetPage();
    }

    public function updateStatus($ordenId, $newStatus)
    {
        $orden = Orden::find($ordenId);
        if ($orden && $orden->empresa_id == session('empresa_id')) {
            $orden->update(['status' => $newStatus]);
            $this->dispatch('toast', type: 'success', message: 'Estado actualizado a: ' . $newStatus);
        }
    }

    public function render()
    {
        $empresaId = session('empresa_id');
        $query = Orden::where('empresa_id', $empresaId);

        // Search
        if ($this->search) {
            $query->where(function($q) {
                $q->where('folio', 'ilike', '%' . $this->search . '%')
                  ->orWhere('cliente_nombre', 'ilike', '%' . $this->search . '%')
                  ->orWhere('cliente_telefono', 'ilike', '%' . $this->search . '%');
            });
        }

        // Status filter
        if ($this->filterStatus) {
            $query->where('status', $this->filterStatus);
        }

        // Date filter
        switch ($this->filterDate) {
            case 'hoy':
                $query->whereDate('created_at', Carbon::today());
                break;
            case 'ayer':
                $query->whereDate('created_at', Carbon::yesterday());
                break;
            case 'semana':
                $query->where('created_at', '>=', Carbon::now()->startOfWeek());
                break;
            case 'mes':
                $query->where('created_at', '>=', Carbon::now()->startOfMonth());
                break;
            case 'rango':
                if ($this->dateFrom) {
                    $query->whereDate('created_at', '>=', $this->dateFrom);
                }
                if ($this->dateTo) {
                    $query->whereDate('created_at', '<=', $this->dateTo);
                }
                break;
        }

        $ordenes = $query->orderBy('created_at', 'desc')->paginate(15);

        // Status counts
        $statusCounts = Orden::where('empresa_id', $empresaId)
            ->whereDate('created_at', Carbon::today())
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return view('livewire.ops.ordenes', [
            'ordenes' => $ordenes,
            'statusCounts' => $statusCounts,
        ]);
    }
}

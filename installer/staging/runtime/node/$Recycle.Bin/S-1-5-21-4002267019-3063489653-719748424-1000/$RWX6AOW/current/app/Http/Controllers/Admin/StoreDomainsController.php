<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\StoreDomain;
use Illuminate\Http\Request;

class StoreDomainsController extends Controller
{
    public function index(Empresa $empresa)
    {
        $domains = $empresa->domains()->orderBy('is_primary', 'desc')->orderBy('domain')->get();
        return view('admin.stores.domains', compact('empresa', 'domains'));
    }

    public function store(Request $request, Empresa $empresa)
    {
        $request->validate([
            'domain' => 'required|string|max:255|unique:store_domains,domain',
            'is_primary' => 'boolean',
            'ssl_enabled' => 'boolean',
        ]);

        $domain = $empresa->domains()->create([
            'domain' => strtolower(trim($request->domain)),
            'is_primary' => $request->boolean('is_primary'),
            'is_active' => true,
            'ssl_enabled' => $request->boolean('ssl_enabled', true),
        ]);

        // If marked as primary, update empresa and unset other primaries
        if ($domain->is_primary) {
            $empresa->domains()->where('id', '!=', $domain->id)->update(['is_primary' => false]);
            $empresa->update(['primary_domain' => $domain->domain]);
        }

        return redirect()->route('admin.empresas.domains', $empresa)
            ->with('success', "Dominio {$domain->domain} agregado.");
    }

    public function update(Request $request, Empresa $empresa, StoreDomain $domain)
    {
        $request->validate([
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
            'ssl_enabled' => 'boolean',
        ]);

        $domain->update([
            'is_primary' => $request->boolean('is_primary'),
            'is_active' => $request->boolean('is_active', true),
            'ssl_enabled' => $request->boolean('ssl_enabled', true),
        ]);

        if ($domain->is_primary) {
            $empresa->domains()->where('id', '!=', $domain->id)->update(['is_primary' => false]);
            $empresa->update(['primary_domain' => $domain->domain]);
        } elseif ($empresa->primary_domain === $domain->domain) {
            $empresa->update(['primary_domain' => null]);
        }

        StoreDomain::clearCache($domain->domain);

        return redirect()->route('admin.empresas.domains', $empresa)
            ->with('success', 'Dominio actualizado.');
    }

    public function destroy(Empresa $empresa, StoreDomain $domain)
    {
        $domainName = $domain->domain;

        if ($empresa->primary_domain === $domainName) {
            $empresa->update(['primary_domain' => null]);
        }

        StoreDomain::clearCache($domainName);
        $domain->delete();

        return redirect()->route('admin.empresas.domains', $empresa)
            ->with('success', "Dominio {$domainName} eliminado.");
    }
}

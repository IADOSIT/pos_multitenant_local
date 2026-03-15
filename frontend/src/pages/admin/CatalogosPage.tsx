import { useState } from 'react';
import { BookOpen, Package, Tag, Beef } from 'lucide-react';
import ProductosAdmin from './ProductosAdmin';
import CategoriasAdmin from './CategoriasAdmin';
import MateriaPrimaPage from './MateriaPrimaPage';

const TABS = [
  { id: 'productos',   label: 'Productos',    icon: Package },
  { id: 'categorias',  label: 'Categorias',   icon: Tag },
  { id: 'materia',     label: 'Materia Prima', icon: Beef },
] as const;

type TabId = typeof TABS[number]['id'];

export default function CatalogosPage() {
  const [tab, setTab] = useState<TabId>('productos');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-700 flex-shrink-0">
        <BookOpen size={18} className="text-slate-400 mr-2 shrink-0" />
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'productos'  && <ProductosAdmin />}
        {tab === 'categorias' && <CategoriasAdmin />}
        {tab === 'materia'    && <MateriaPrimaPage />}
      </div>
    </div>
  );
}

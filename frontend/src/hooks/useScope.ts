import { useAuthStore } from '../store/auth.store';
import { useAdminContextStore } from '../store/adminContext.store';

// IDs de la tienda/empresa ACTIVA. Si un superadmin está "viendo como" una tienda
// (selector inferior), TODO lo que dependa de config por-tienda/empresa (IVA, flags de
// POS, báscula, config especial, salas de socket, etc.) debe usar esa tienda/empresa,
// no la de la cuenta del superadmin. El resto de usuarios usa su propia tienda/empresa.
export function useScope() {
  const user = useAuthStore((s) => s.user);
  const viewAs = useAdminContextStore((s) => s.viewAs);
  return {
    tiendaId: viewAs?.tienda_id ?? user?.tienda_id,
    empresaId: viewAs?.empresa_id ?? user?.empresa_id,
  };
}

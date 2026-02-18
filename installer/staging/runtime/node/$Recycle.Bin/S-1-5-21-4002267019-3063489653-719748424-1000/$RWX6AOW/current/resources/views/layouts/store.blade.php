<!-- Contadores de carrito en el header -->
<span id='cartCount'>0</span>
<span id='cartTotal'>.00</span>

<!-- Contenedor de Toast -->
<div id='toastAdded' style='display: none; position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #333; color: #fff; border-radius: 5px;'>Agregado ✓</div>

<script>
    async function refreshCartSummary() {
        const res = await fetch('{{ route('cart.summary') }}');
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('cartCount').innerText = data.count;
        document.getElementById('cartTotal').innerText = '$' + data.total.toFixed(2);
    }

    document.addEventListener('click', async (e) => {
        if (!e.target.matches('.btn-add-to-cart')) return;
        const button = e.target;
        const productoId = button.dataset.productoId;

        button.disabled = true;
        button.textContent = 'Agregando...';

        const res = await fetch('{{ route('cart.add') }}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto_id: productoId, qty: 1 }),
        });

        if (res.ok) {
            button.textContent = 'Agregado ✓';
            setTimeout(() => {
                button.textContent = 'Agregar';
                button.disabled = false;
            }, 1000);
            refreshCartSummary();
            document.getElementById('toastAdded').style.display = 'block';
            setTimeout(() => {
                document.getElementById('toastAdded').style.display = 'none';
            }, 2000);
        } else {
            button.textContent = 'Error';
            setTimeout(() => {
                button.textContent = 'Agregar';
                button.disabled = false;
            }, 1000);
        }
    });

    // Llamar al inicio para que el carrito siempre se muestre actualizado
    document.addEventListener("DOMContentLoaded", refreshCartSummary);
</script>

<script>
(function(){
  //... Código JavaScript para AJAX y actualizaciones dinámicas del carrito (mismo bloque que antes)
})();
</script>
<!-- /EMC_CART_AJAX_PATCH_v2 -->

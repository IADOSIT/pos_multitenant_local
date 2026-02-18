import './bootstrap';

// Alpine.js (if not using via Livewire)
// import Alpine from 'alpinejs';
// window.Alpine = Alpine;
// Alpine.start();

// Global utilities
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

window.formatDate = function(date) {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
};

// Livewire event listeners
document.addEventListener('livewire:initialized', () => {
    // Toast notifications
    Livewire.on('toast', (data) => {
        const { type, message } = data[0] || data;
        showToast(type, message);
    });
});

function showToast(type, message) {
    const colors = {
        success: 'bg-success text-success-content',
        error: 'bg-error text-error-content',
        warning: 'bg-warning text-warning-content',
        info: 'bg-info text-info-content'
    };

    const toast = document.createElement('div');
    toast.className = `alert ${colors[type] || colors.info} shadow-lg fixed top-4 right-4 z-50 max-w-sm toast-enter`;
    toast.innerHTML = `<span>${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

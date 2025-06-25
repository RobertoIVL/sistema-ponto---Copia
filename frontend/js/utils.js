// Utilitários gerais
const API_BASE = '/api';

// Fazer requisições autenticadas
async function fetchAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
    }

    return response;
}

// Formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Formatar hora
function formatarHora(hora) {
    if (!hora) return '--:--';
    return hora.substring(0, 5);
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Implementar sistema de notificações
    alert(mensagem);
}
// Gerenciamento de login
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (token) {
        mostrarDashboard();
    } else {
        mostrarLogin();
    }

    // Event listeners
    document.getElementById('form-login').addEventListener('submit', fazerLogin);
    document.getElementById('btn-logout').addEventListener('click', fazerLogout);
});

async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            mostrarDashboard();
        } else {
            mostrarNotificacao(data.erro || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        mostrarNotificacao('Erro de conexão', 'error');
    }
}

function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    mostrarLogin();
}

function mostrarLogin() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function mostrarDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    document.getElementById('usuario-nome').textContent = usuario.nome || 'Usuário';
    
    // Show admin link if user is admin
    if (usuario.cargo && usuario.cargo.includes('Admin')) {
        document.getElementById('admin-link').style.display = 'inline';
    }
    
    iniciarDashboard();
}
// Dados fictícios para demonstração
let users = [];

let schedules = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    loadUsers();
    loadSchedules();
    loadUserSelects();
    setDefaultDates();
});

// Navegação entre abas
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    tablinks = document.getElementsByClassName("nav-tab");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Atualizar estatísticas
function updateStats() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activeUsers').textContent = users.filter(u => u.status === 'ativo').length;
    document.getElementById('totalSchedules').textContent = schedules.length;
    document.getElementById('pendingApprovals').textContent = Math.floor(Math.random() * 10);
}

// Carregar usuários na tabela
async function loadUsers() {
    try {
        const response = await fetchAuth(`${API_BASE}/usuarios`);
        if (!response.ok) {
            throw new Error('Erro ao buscar usuários');
        }
        users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            // O status do usuário virá do banco de dados, ajuste conforme necessário
            const status = user.status || 'ativo';
            row.innerHTML = `
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td>${capitalizeFirst(user.cargo)}</td>
                <td>${getDepartmentName(user.departamento)}</td>
                <td><span class="status-badge status-${status}">${capitalizeFirst(status)}</span></td>
                <td>
                    <button class="btn btn-warning" onclick="editUser(${user.id})" style="padding: 8px 12px; margin-right: 5px;">✏️ Editar</button>
                    <button class="btn btn-primary" onclick="resetPassword(${user.id})" style="padding: 8px 12px; margin-right: 5px;">🔑 Senha</button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})" style="padding: 8px 12px;">🗑️ Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        updateStats();
        loadUserSelects();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        mostrarNotificacao('Não foi possível carregar a lista de usuários.', 'error');
    }
}

// Carregar escalas na tabela
async function loadSchedules() {
    try {
        const response = await fetchAuth(`${API_BASE}/escalas`);
        if (!response.ok) {
            throw new Error('Erro ao buscar escalas');
        }
        schedules = await response.json();

        const tbody = document.getElementById('schedulesTableBody');
        tbody.innerHTML = '';
        
        schedules.forEach(schedule => {
            const status = schedule.ativo ? 'ativo' : 'inativo';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${schedule.nome}</td>
                <td>${schedule.usuario_nome || 'N/A'}</td>
                <td>${capitalizeFirst(schedule.tipo)}</td>
                <td>${schedule.carga_horaria_semanal}h</td>
                <td><span class="status-badge status-${status}">${capitalizeFirst(status)}</span></td>
                <td>
                    <button class="btn btn-warning" onclick="editSchedule(${schedule.id})" style="padding: 8px 12px; margin-right: 5px;">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deleteSchedule(${schedule.id})" style="padding: 8px 12px;">🗑️ Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar escalas:', error);
        mostrarNotificacao('Não foi possível carregar a lista de escalas.', 'error');
    }
}

// Carregar usuários nos selects
function loadUserSelects() {
    const selects = ['scheduleUser', 'reportUser'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = selectId === 'reportUser' ? '<option value="">Todos os usuários</option>' : '<option value="">Selecione o usuário</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    });
}

// Adicionar usuário
async function addUser() {
    const nome = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const cpf = document.getElementById('userCPF').value;
    const cargo = document.getElementById('userRole').value;
    const departamento = document.getElementById('userDepartment').value;
    const senha = document.getElementById('userPassword').value;

    if (!nome || !email || !cpf || !cargo || !senha) {
        mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (!validateEmail(email)) {
        mostrarNotificacao('Por favor, insira um email válido.', 'warning');
        return;
    }

    if (!validateCPF(cpf)) {
        mostrarNotificacao('Por favor, insira um CPF válido.', 'warning');
        return;
    }

    const novoUsuario = { nome, email, cpf, cargo, departamento, senha };

    try {
        const response = await fetchAuth(`${API_BASE}/usuarios`, {
            method: 'POST',
            body: JSON.stringify(novoUsuario)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao criar usuário');
        }

        await loadUsers();
        clearUserForm();
        mostrarNotificacao(`Usuário ${nome} adicionado com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        mostrarNotificacao(error.message, 'error');
    }
}

// Editar usuário
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserName').value = user.nome;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.cargo;
    document.getElementById('editUserStatus').value = (user.ativo === 1 || user.ativo === undefined) ? 'ativo' : 'inativo';
    document.getElementById('editUserPassword').value = '';
    
    document.getElementById('editUserModal').style.display = 'block';
    document.getElementById('editUserModal').dataset.userId = userId;
}

// Atualizar usuário
async function updateUser() {
    const userId = parseInt(document.getElementById('editUserModal').dataset.userId);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUser = {
        nome: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        cargo: document.getElementById('editUserRole').value,
        ativo: document.getElementById('editUserStatus').value === 'ativo' ? 1 : 0,
        departamento: user.departamento // Manter o departamento original
    };

    // Lidar com a atualização de senha separadamente se necessário
    const newPassword = document.getElementById('editUserPassword').value;
    if (newPassword) {
        // A API precisaria de um endpoint específico para alterar a senha
        mostrarNotificacao('A funcionalidade de alterar senha precisa ser implementada no backend.', 'info');
    }

    try {
        const response = await fetchAuth(`${API_BASE}/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao atualizar usuário');
        }

        await loadUsers();
        closeModal('editUserModal');
        mostrarNotificacao(`Usuário ${updatedUser.nome} atualizado com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        mostrarNotificacao(error.message, 'error');
    }
}

// Deletar usuário
async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
        try {
            const response = await fetchAuth(`${API_BASE}/usuarios/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao deletar usuário');
            }

            await loadUsers();
            mostrarNotificacao('Usuário excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            mostrarNotificacao(error.message, 'error');
        }
    }
}

// Resetar senha
function resetPassword(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPassword = generateRandomPassword();
    if (confirm(`Resetar senha do usuário ${user.name}?\nNova senha: ${newPassword}`)) {
        alert(`Senha resetada com sucesso!\nNova senha: ${newPassword}\n\nEnvie esta senha para o usuário de forma segura.`);
    }
}

// Gerar senha aleatória
function generatePassword() {
    const password = generateRandomPassword();
    document.getElementById('userPassword').value = password;
    checkPasswordStrength();
    alert(`Senha gerada: ${password}`);
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Verificar força da senha
function checkPasswordStrength() {
    const password = document.getElementById('userPassword').value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');

    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push('pelo menos 8 caracteres');

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('letra minúscula');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('letra maiúscula');

    if (/[0-9]/.test(password)) strength++;
    else feedback.push('número');

    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else feedback.push('caractere especial');

    const levels = ['strength-weak', 'strength-weak', 'strength-medium', 'strength-good', 'strength-strong'];
    const texts = ['Muito Fraca', 'Fraca', 'Média', 'Boa', 'Forte'];

    strengthBar.className = `password-strength-bar ${levels[strength]}`;
    strengthText.textContent = password ? `${texts[strength]} ${feedback.length ? '(falta: ' + feedback.join(', ') + ')' : ''}` : '';
}

// Salvar escala
async function saveSchedule() {
    const nome = document.getElementById('scheduleName').value;
    const usuario_id = parseInt(document.getElementById('scheduleUser').value);
    const tipo = document.getElementById('scheduleType').value;
    const carga_horaria_semanal = parseInt(document.getElementById('weeklyHours').value);

    if (!nome || !usuario_id || !tipo || !carga_horaria_semanal) {
        mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    const novaEscala = {
        nome,
        usuario_id,
        tipo,
        carga_horaria_semanal,
        dias_trabalho: getScheduleDays()
    };

    try {
        const response = await fetchAuth(`${API_BASE}/escalas`, {
            method: 'POST',
            body: JSON.stringify(novaEscala)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao criar escala');
        }

        await loadSchedules();
        clearScheduleForm();
        mostrarNotificacao(`Escala ${nome} salva com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao salvar escala:', error);
        mostrarNotificacao(error.message, 'error');
    }
}

// Obter dados dos dias da escala
function getScheduleDays() {
    const days = {};
    const timeInputs = document.querySelectorAll('.time-input');
    
    timeInputs.forEach(input => {
        const day = input.dataset.day;
        const type = input.dataset.type;
        
        if (!days[day]) days[day] = {};
        days[day][type] = input.value;
    });
    
    return days;
}

// Aplicar modelo de escala
function applyTemplate() {
    const templates = {
        'comercial': { entrada: '08:00', saida: '17:00' },
        'industrial': { entrada: '07:00', saida: '16:00' },
        'noturno': { entrada: '22:00', saida: '06:00' }
    };

    const template = prompt('Escolha um modelo:\n1 - Comercial (8h-17h)\n2 - Industrial (7h-16h)\n3 - Noturno (22h-6h)');
    
    let selectedTemplate;
    switch(template) {
        case '1': selectedTemplate = templates.comercial; break;
        case '2': selectedTemplate = templates.industrial; break;
        case '3': selectedTemplate = templates.noturno; break;
        default: return;
    }

    const timeInputs = document.querySelectorAll('.time-input');
    timeInputs.forEach(input => {
        if (input.dataset.type === 'entrada') {
            input.value = selectedTemplate.entrada;
        } else {
            input.value = selectedTemplate.saida;
        }
    });
}

// Gerar relatório
function generateReport() {
    const type = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const userId = document.getElementById('reportUser').value;

    if (!type || !startDate || !endDate) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const reportResults = document.getElementById('reportResults');
    
    let reportContent = `
        <h3>Relatório: ${getReportTypeName(type)}</h3>
        <p><strong>Período:</strong> ${formatDate(startDate)} a ${formatDate(endDate)}</p>
        <div style="margin-top: 20px;">
    `;

    // Simular dados do relatório
    switch(type) {
        case 'attendance':
            reportContent += generateAttendanceReport(userId);
            break;
        case 'department':
            reportContent += generateDepartmentReport();
            break;
        case 'overtime':
            reportContent += generateOvertimeReport();
            break;
        case 'absences':
            reportContent += generateAbsencesReport();
            break;
        case 'summary':
            reportContent += generateSummaryReport();
            break;
    }

    reportContent += '</div>';
    reportResults.innerHTML = reportContent;
}

// Gerar dados fictícios para relatórios
function generateAttendanceReport(userId) {
    const targetUsers = userId ? users.filter(u => u.id == userId) : users;
    let content = '<table class="users-table"><thead><tr><th>Usuário</th><th>Dias Trabalhados</th><th>Horas Totais</th><th>Atrasos</th><th>Faltas</th></tr></thead><tbody>';
    
    targetUsers.forEach(user => {
        content += `
            <tr>
                <td>${user.name}</td>
                <td>${Math.floor(Math.random() * 22) + 18}</td>
                <td>${Math.floor(Math.random() * 200) + 150}h</td>
                <td>${Math.floor(Math.random() * 5)}</td>
                <td>${Math.floor(Math.random() * 3)}</td>
            </tr>
        `;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateDepartmentReport() {
    const departments = ['ti', 'rh', 'financeiro', 'vendas', 'marketing', 'operacoes'];
    let content = '<table class="users-table"><thead><tr><th>Departamento</th><th>Funcionários</th><th>Horas Médias</th><th>Produtividade</th></tr></thead><tbody>';
    
    departments.forEach(dept => {
        content += `
            <tr>
                <td>${getDepartmentName(dept)}</td>
                <td>${Math.floor(Math.random() * 15) + 5}</td>
                <td>${Math.floor(Math.random() * 50) + 160}h</td>
                <td>${Math.floor(Math.random() * 30) + 70}%</td>
            </tr>
        `;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateOvertimeReport() {
    let content = '<table class="users-table"><thead><tr><th>Usuário</th><th>Horas Extras</th><th>Valor (R$)</th><th>Aprovado</th></tr></thead><tbody>';
    
    users.forEach(user => {
        const overtime = Math.floor(Math.random() * 20);
        content += `
            <tr>
                <td>${user.name}</td>
                <td>${overtime}h</td>
                <td>R$ ${(overtime * 25).toFixed(2)}</td>
                <td><span class="status-badge status-active">Sim</span></td>
            </tr>
        `;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateAbsencesReport() {
    let content = '<table class="users-table"><thead><tr><th>Usuário</th><th>Faltas</th><th>Atrasos</th><th>Justificadas</th></tr></thead><tbody>';
    
    users.forEach(user => {
        content += `
            <tr>
                <td>${user.name}</td>
                <td>${Math.floor(Math.random() * 3)}</td>
                <td>${Math.floor(Math.random() * 5)}</td>
                <td>${Math.floor(Math.random() * 2)}</td>
            </tr>
        `;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateSummaryReport() {
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>95%</h3>
                <p>Taxa de Presença</p>
            </div>
            <div class="stat-card">
                <h3>1,856</h3>
                <p>Horas Trabalhadas</p>
            </div>
            <div class="stat-card">
                <h3>23</h3>
                <p>Horas Extras</p>
            </div>
            <div class="stat-card">
                <h3>7</h3>
                <p>Faltas Totais</p>
            </div>
        </div>
    `;
}

// Salvar configurações
function saveSettings() {
    const settings = {
        companyName: document.getElementById('companyName').value,
        lateTolerance: document.getElementById('lateTolerance').value,
        defaultStartTime: document.getElementById('defaultStartTime').value,
        defaultEndTime: document.getElementById('defaultEndTime').value,
        timezone: document.getElementById('timezone').value,
        autoBackup: document.getElementById('autoBackup').value,
        notificationEmail: document.getElementById('notificationEmail').value,
        notifyAbsences: document.getElementById('notifyAbsences').value,
        notifyLateArrivals: document.getElementById('notifyLateArrivals').value,
        weeklyReport: document.getElementById('weeklyReport').value
    };

    // Simular salvamento
    alert('Configurações salvas com sucesso!');
}

// Funções auxiliares
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDepartmentName(dept) {
    const names = {
        'ti': 'Tecnologia da Informação',
        'rh': 'Recursos Humanos',
        'financeiro': 'Financeiro',
        'vendas': 'Vendas',
        'marketing': 'Marketing',
        'operacoes': 'Operações'
    };
    return names[dept] || dept;
}

function getReportTypeName(type) {
    const names = {
        'attendance': 'Frequência por Usuário',
        'department': 'Relatório por Departamento',
        'overtime': 'Horas Extras',
        'absences': 'Faltas e Atrasos',
        'summary': 'Resumo Mensal'
    };
    return names[type] || type;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCPF(cpf) {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
}

function clearUserForm() {
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userCPF').value = '';
    document.getElementById('userRole').value = '';
    document.getElementById('userDepartment').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('passwordStrengthBar').className = 'password-strength-bar';
    document.getElementById('passwordStrengthText').textContent = '';
}

function clearScheduleForm() {
    document.getElementById('scheduleName').value = '';
    document.getElementById('scheduleUser').value = '';
    document.getElementById('scheduleType').value = '';
    document.getElementById('weeklyHours').value = '';
    document.querySelectorAll('.time-input').forEach(input => input.value = '');
}

function clearSchedule() {
    clearScheduleForm();
}

function toggleDay(element, day) {
    element.classList.toggle('selected');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function exportUsers() {
    alert('Exportando lista de usuários... (funcionalidade seria implementada aqui)');
}

function exportReport() {
    alert('Exportando relatório em PDF... (funcionalidade seria implementada aqui)');
}

function exportExcel() {
    alert('Exportando relatório em Excel... (funcionalidade seria implementada aqui)');
}

function backupData() {
    alert('Realizando backup dos dados... (funcionalidade seria implementada aqui)');
}

function resetSettings() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
        alert('Configurações restauradas com sucesso!');
    }
}

function editSchedule(scheduleId) {
    alert(`Editando escala ID: ${scheduleId} (funcionalidade seria implementada aqui)`);
}

async function deleteSchedule(scheduleId) {
    if (confirm('Tem certeza que deseja excluir esta escala?')) {
        try {
            const response = await fetchAuth(`${API_BASE}/escalas/${scheduleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao deletar escala');
            }

            await loadSchedules();
            mostrarNotificacao('Escala excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao deletar escala:', error);
            mostrarNotificacao(error.message, 'error');
        }
    }
}

// Máscara para CPF
document.getElementById('userCPF').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// Fechar modal clicando fora
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}
// Gerenciamento do dashboard
let intervalosAtivos = [];

function iniciarDashboard() {
    atualizarHoraAtual();
    carregarRegistrosHoje();
    
    // Atualizar hora a cada segundo
    setInterval(atualizarHoraAtual, 1000);
}

function atualizarHoraAtual() {
    const agora = new Date();
    
    const hora = agora.toLocaleTimeString('pt-BR', { hour12: false });
    const data = agora.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    document.getElementById('hora-atual').textContent = hora;
    document.getElementById('data-atual').textContent = data;
}

async function registrarPonto(tipo) {
    try {
        const response = await fetchAuth(`${API_BASE}/pontos/registrar`, {
            method: 'POST',
            body: JSON.stringify({ tipo })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarNotificacao(`${tipo.replace('_', ' ').toUpperCase()} registrada com sucesso!`, 'success');
            carregarRegistrosHoje();
        } else {
            mostrarNotificacao(data.erro || 'Erro ao registrar ponto', 'error');
        }
    } catch (error) {
        mostrarNotificacao('Erro de conexão', 'error');
    }
}

async function carregarRegistrosHoje() {
    try {
        const response = await fetchAuth(`${API_BASE}/pontos/hoje`);
        const registros = await response.json();

        const container = document.getElementById('registros-hoje-lista');
        container.innerHTML = '';

        const tipos = [
            { key: 'entrada', label: 'Entrada' },
            { key: 'saida_almoco', label: 'Saída Almoço' },
            { key: 'volta_almoco', label: 'Volta Almoço' },
            { key: 'saida', label: 'Saída' }
        ];

        tipos.forEach(tipo => {
            const div = document.createElement('div');
            div.className = 'registro-item';
            div.innerHTML = `
                <span>${tipo.label}:</span>
                <span>${formatarHora(registros[tipo.key])}</span>
            `;
            container.appendChild(div);
        });

        // Mostrar horas trabalhadas se disponível
        if (registros.horas_trabalhadas) {
            const divHoras = document.createElement('div');
            divHoras.className = 'registro-item';
            divHoras.innerHTML = `
                <span><strong>Horas Trabalhadas:</strong></span>
                <span><strong>${registros.horas_trabalhadas.toFixed(2)}h</strong></span>
            `;
            container.appendChild(divHoras);
        }

        // Mostrar horas extras se houver
        if (registros.horas_extras && registros.horas_extras > 0) {
            const divExtras = document.createElement('div');
            divExtras.className = 'registro-item';
            divExtras.innerHTML = `
                <span><strong>Horas Extras:</strong></span>
                <span style="color: #28a745;"><strong>${registros.horas_extras.toFixed(2)}h</strong></span>
            `;
            container.appendChild(divExtras);
        }

    } catch (error) {
        mostrarNotificacao('Erro ao carregar registros', 'error');
    }
}

async function carregarRelatorio() {
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;

    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Selecione as datas de início e fim', 'warning');
        return;
    }

    try {
        const response = await fetchAuth(
            `${API_BASE}/pontos/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}`
        );
        const registros = await response.json();

        const container = document.getElementById('tabela-relatorio');
        
        if (registros.length === 0) {
            container.innerHTML = '<p>Nenhum registro encontrado para o período selecionado.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Entrada</th>
                        <th>Saída Almoço</th>
                        <th>Volta Almoço</th>
                        <th>Saída</th>
                        <th>Horas Trabalhadas</th>
                        <th>Horas Extras</th>
                    </tr>
                </thead>
                <tbody>
        `;

        registros.forEach(registro => {
            html += `
                <tr>
                    <td>${formatarData(registro.data)}</td>
                    <td>${formatarHora(registro.entrada)}</td>
                    <td>${formatarHora(registro.saida_almoco)}</td>
                    <td>${formatarHora(registro.volta_almoco)}</td>
                    <td>${formatarHora(registro.saida)}</td>
                    <td>${registro.horas_trabalhadas ? registro.horas_trabalhadas.toFixed(2) + 'h' : '--'}</td>
                    <td style="color: ${registro.horas_extras > 0 ? '#28a745' : '#666'};">
                        ${registro.horas_extras ? registro.horas_extras.toFixed(2) + 'h' : '--'}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Calcular totais
        const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0);
        const totalExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0);

        const resumo = document.createElement('div');
        resumo.className = 'resumo-periodo';
        resumo.innerHTML = `
            <h4>Resumo do Período</h4>
            <p><strong>Total de Horas Trabalhadas:</strong> ${totalHoras.toFixed(2)}h</p>
            <p><strong>Total de Horas Extras:</strong> ${totalExtras.toFixed(2)}h</p>
        `;
        container.appendChild(resumo);

    } catch (error) {
        mostrarNotificação('Erro ao carregar relatório', 'error');
    }
}
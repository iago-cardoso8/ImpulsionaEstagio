// Inicialização dos filtros dropdown
const botoesGatilho = document.querySelectorAll('.btn-gatilho');

botoesGatilho.forEach(botao => {
    botao.addEventListener('click', (evento) => {
        evento.stopPropagation();

        const idDoMenu = botao.getAttribute('data-alvo');
        const menuDesejado = document.getElementById(idDoMenu);

        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu.id !== idDoMenu) {
                menu.classList.add('escondido');
            }
        });

        menuDesejado.classList.toggle('escondido');
    });
});

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('escondido');
    });
});

document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.addEventListener('click', (evento) => {
        evento.stopPropagation();
    });
});

const botoesAplicar = document.querySelectorAll('.btn-aplicar-filtro');

botoesAplicar.forEach(botao => {
    botao.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('escondido');
        });
        renderJobs();
    });
});

const form = document.getElementById('createJobForm');
const editJobIdInput = document.getElementById('editJobId');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formMessage = document.getElementById('formMessage');
const stateSelect = document.getElementById('regState');
const cityInput = document.getElementById('regCity');
const cityDataList = document.getElementById('regCityList');

const citiesByState = {
    AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira'],
    AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios'],
    AP: ['Macapá', 'Santana', 'Laranjal do Jari'],
    AM: ['Manaus', 'Parintins', 'Itacoatiara'],
    BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
    CE: ['Fortaleza', 'Juazeiro do Norte', 'Sobral'],
    DF: ['Brasília'],
    ES: ['Vitória', 'Vila Velha', 'Serra'],
    GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
    MA: ['São Luís', 'Imperatriz', 'Caxias'],
    MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
    MS: ['Campo Grande', 'Dourados', 'Três Lagoas'],
    MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
    PA: ['Belém', 'Ananindeua', 'Santarém'],
    PB: ['João Pessoa', 'Campina Grande', 'Santa Rita'],
    PR: ['Curitiba', 'Londrina', 'Maringá'],
    PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
    PI: ['Teresina', 'Parnaíba', 'Picos'],
    RJ: ['Rio de Janeiro', 'Niterói', 'Nova Iguaçu'],
    RN: ['Natal', 'Mossoró', 'Parnamirim'],
    RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
    RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'],
    RR: ['Boa Vista', 'Pacaraima', 'Rorainópolis'],
    SC: ['Florianópolis', 'Joinville', 'Blumenau'],
    SP: ['São Paulo', 'Campinas', 'Santos'],
    SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto'],
    TO: ['Palmas', 'Araguaína', 'Gurupi']
};

async function populateCityOptions(state, selectedCity = '') {
    cityDataList.innerHTML = '';
    cityInput.value = '';
    if (!state) {
        cityInput.disabled = true;
        cityInput.placeholder = 'Selecione primeiro a UF';
        return;
    }

    // Load IF campi JSON once and cache in window
    if (!window.__ifCampiByUF) {
        try {
            const resp = await fetch('/js/if_campi_by_uf.json');
            window.__ifCampiByUF = resp.ok ? await resp.json() : {};
        } catch (e) {
            window.__ifCampiByUF = {};
        }
    }

    const cities = (citiesByState[state] || []).slice();
    if (window.__ifCampiByUF[state]) {
        window.__ifCampiByUF[state].forEach(c => { if (!cities.includes(c)) cities.push(c); });
    }

    cities.sort();
    cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        cityDataList.appendChild(opt);
    });

    cityInput.disabled = false;
    cityInput.placeholder = 'Escolha ou digite a cidade';
    if (selectedCity) cityInput.value = selectedCity;
}

stateSelect.addEventListener('change', () => {
    populateCityOptions(stateSelect.value);
});

cancelEditBtn.style.display = 'none';

function setFormMessage(message, isError = true) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}

function clearFormMessage() {
    if (!formMessage) return;
    formMessage.textContent = '';
}

function buildJobPayload() {
    const state = document.getElementById('regState').value;
    const city = document.getElementById('regCity').value;

    return {
        title: document.getElementById('regTitle').value.trim(),
        company: document.getElementById('regCompany').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        location: city && state ? `${city} - ${state}` : '',
        salary: `R$ ${document.getElementById('regSalary').value.trim()},00`,
        target: document.getElementById('regTarget').value,
        desc: document.getElementById('regDesc').value.trim(),
        requirements: document.getElementById('regReq').value.split('\n').map(item => item.trim()).filter(item => item !== ''),
        benefits: document.getElementById('regBenefits').value.split('\n').map(item => item.trim()).filter(item => item !== ''),
        type: 'Estágio',
        time: 'Agora mesmo'
    };
}

function validateJobPayload(payload) {
    const required = ['title', 'company', 'email', 'location', 'salary', 'target'];
    for (const field of required) {
        if (!payload[field] || payload[field].toString().trim() === '') {
            return `O campo ${field} é obrigatório.`;
        }
    }

    if (!document.getElementById('regState').value) {
        return 'Selecione a UF para continuar.';
    }

    if (!document.getElementById('regCity').value) {
        return 'Selecione a cidade para continuar.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.email)) {
        return 'Informe um e-mail válido.';
    }

    const numericSalary = Number(String(payload.salary).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (Number.isNaN(numericSalary) || numericSalary <= 0) {
        return 'Informe um valor de bolsa válido maior que zero.';
    }

    return null;
}

function resetFormState() {
    editJobIdInput.value = '';
    cancelEditBtn.style.display = 'none';
    form.querySelector('button[type="submit"]').textContent = 'Publicar Vaga';
    clearFormMessage();
}

function populateJobForm(job) {
    editJobIdInput.value = job.id;
    document.getElementById('regTitle').value = job.title || '';
    document.getElementById('regCompany').value = job.company || '';
    document.getElementById('regEmail').value = job.email || '';

    const [city = '', state = ''] = String(job.location || '').split(' - ');
    document.getElementById('regState').value = state;
    populateCityOptions(state, city);
    document.getElementById('regCity').value = city || '';

    document.getElementById('regSalary').value = String(job.salary).replace(/[^0-9]/g, '') || '';
    document.getElementById('regTarget').value = job.target || 'Informática';
    document.getElementById('regDesc').value = job.desc || '';
    document.getElementById('regReq').value = Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '';
    document.getElementById('regBenefits').value = Array.isArray(job.benefits) ? job.benefits.join('\n') : job.benefits || '';
    form.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
    cancelEditBtn.style.display = 'inline-block';
    clearFormMessage();
}

async function submitJobForm(event) {
    event.preventDefault();

    const payload = buildJobPayload();
    const validationError = validateJobPayload(payload);
    if (validationError) {
        setFormMessage(validationError, true);
        return;
    }

    const isEditing = !!editJobIdInput.value;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/vagas/${editJobIdInput.value}` : '/api/vagas';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            setFormMessage(result.erro || 'Erro ao salvar vaga.', true);
            return;
        }

        setFormMessage(result.mensagem || 'Operação realizada com sucesso.', false);
        form.reset();
        resetFormState();
        await carregarVagas();
        switchView('jobs');
    } catch (error) {
        console.error(error);
        setFormMessage('Falha na conexão com o servidor.', true);
    }
}

async function startJobEdit(id) {
    try {
        const job = await loadJobById(id);
        if (!job) {
            alert('Vaga não encontrada.');
            return;
        }
        populateJobForm(job);
        switchView('register');
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar os dados da vaga para edição.');
    }
}

async function deleteJob(id) {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) {
        return;
    }

    try {
        const response = await fetch(`/api/vagas/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            alert(result.erro || 'Erro ao excluir vaga.');
            return;
        }

        await carregarVagas();
        switchView('jobs');
        alert(result.mensagem || 'Vaga excluída com sucesso.');
    } catch (error) {
        console.error(error);
        alert('Erro de conexão ao excluir vaga.');
    }
}

function cancelEdit() {
    form.reset();
    resetFormState();
}

form.addEventListener('submit', submitJobForm);
cancelEditBtn.addEventListener('click', cancelEdit);
window.startJobEdit = startJobEdit;
window.deleteJob = deleteJob;

// Iniciar a tela carregando as vagas da API
carregarVagas();

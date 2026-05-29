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
    return {
        title: document.getElementById('regTitle').value.trim(),
        company: document.getElementById('regCompany').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        location: document.getElementById('regCity').value.trim(),
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
    document.getElementById('regCity').value = job.location || '';
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

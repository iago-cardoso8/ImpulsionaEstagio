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

// Cadastro de nova vaga via fetch (POST /api/vagas)
document.getElementById('createJobForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const novaVaga = {
        title: document.getElementById('regTitle').value,
        company: document.getElementById('regCompany').value,
        location: document.getElementById('regCity').value,
        salary: "R$ " + document.getElementById('regSalary').value + ",00",
        target: document.getElementById('regTarget').value,
        desc: document.getElementById('regDesc').value,
        requirements: document.getElementById('regReq').value.split('\n').filter(r => r.trim() !== ''),
        type: "Estágio",
        time: "Agora mesmo"
    };

    try {
        const resposta = await fetch('/api/vagas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaVaga)
        });

        if (!resposta.ok) {
            const erro = await resposta.json();
            alert('Erro: ' + erro.erro);
            return;
        }

        alert("Vaga cadastrada com sucesso!");
        this.reset();
        switchView('jobs');
    } catch (erro) {
        console.error(erro);
        alert('Erro de conexão ao cadastrar vaga');
    }
});

// Iniciar a tela carregando as vagas da API
carregarVagas();

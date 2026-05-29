async function carregarVagas() {
    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok) throw new Error('Erro ao carregar vagas');
        const resultado = await resposta.json();
        
        // A API retorna { sucesso: true, quantidade: X, dados: [...] }
        if (resultado.sucesso && resultado.dados) {
            jobs = resultado.dados;
            console.log(`✅ ${jobs.length} vagas carregadas`);
        } else {
            throw new Error('Resposta inválida da API');
        }
        
        renderJobs();
    } catch (erro) {
        console.error('❌ Erro ao carregar vagas:', erro);
        document.getElementById('count-label').innerText = 'Erro ao carregar vagas';
    }
}

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));

    if (viewName === 'jobs') {
        document.getElementById('view-jobs-container').classList.add('active-view');
        document.getElementById('nav-vagas').classList.add('active');
        carregarVagas();
    } else {
        document.getElementById('view-register-container').classList.add('active-view');
        document.getElementById('nav-cadastro').classList.add('active');
    }
}

function handleSearch() {
    renderJobs();
}

function showDetails(job) {
    const isSaved = savedJobs.includes(job.id);
    const reqList = Array.isArray(job.requirements)
        ? job.requirements.map(r => `<li>${r}</li>`).join("")
        : `<li>${job.requirements}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map(b => `<li>${b}</li>`).join("")
        : job.benefits ? `<li>${job.benefits}</li>` : '<li>Nenhum benefício listado</li>';

    document.getElementById("job-details").innerHTML = `
    <div style="border-bottom:1px solid #eee; padding-bottom:20px;">
      <h2 style="margin:0; color:#333">${job.title}</h2>
      <h4 style="margin:5px 0; color:#666">${job.company}</h4>
      <p>${job.location} | <strong>${job.salary}</strong></p>
      <p style="margin:4px 0 0; color:#555">E-mail: ${job.email || 'Não informado'}</p>
      <div class="tags">
         <span class="tag">${job.target}</span>
         <span class="tag">${job.type}</span>
      </div>
      <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn-action" onclick="startJobEdit(${job.id})">Editar</button>
        <button class="btn-action btn-delete" onclick="deleteJob(${job.id})">Excluir</button>
        <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
          ${isSaved ? '♥ Salvo' : '♡ Salvar Vaga'}
        </button>
      </div>
    </div>
    <div style="margin-top:20px">
      <div class="info-block">
         <h4>Sobre a Vaga</h4>
         <p style="color:#555; line-height:1.6">${job.desc}</p>
      </div>
      <div class="info-block">
         <h4>Requisitos</h4>
         <ul>${reqList}</ul>
      </div>
      <div class="info-block">
         <h4>Benefícios</h4>
         <ul>${benList}</ul>
      </div>
    </div>
  `;
}

function toggleSave(jobId) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    } else {
        savedJobs.push(jobId);
    }
    localStorage.setItem("ifpb_saved", JSON.stringify(savedJobs));
    renderJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) showDetails(job);
}

function renderJobs() {
    const listContainer = document.getElementById("job-list");
    const searchText = document.getElementById("jobSearch").value.toLowerCase();
    listContainer.innerHTML = "";

    const cidadesMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="cidade"]:checked')).map(cb => cb.value);
    const cursosMarcados = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="curso"]:checked')).map(cb => cb.value);
    const empresasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="empresa"]:checked')).map(cb => cb.value);
    const remunMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="remuneracao"]:checked')).map(cb => cb.value);
    const datasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="data"]:checked')).map(cb => cb.value);

    const filtered = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchText) ||
            job.company.toLowerCase().includes(searchText);

        const matchCidade = cidadesMarcadas.length === 0 ||
            cidadesMarcadas.some(cidade => job.location.includes(cidade));
        const matchCurso = cursosMarcados.length === 0 ||
            cursosMarcados.includes(job.target);
        const matchEmpresa = empresasMarcadas.length === 0 ||
            empresasMarcadas.some(empresa => job.company.includes(empresa));

        let matchRemun = true;
        if (remunMarcadas.length > 0) {
            const valorSalario = parseFloat(job.salary.replace(/[^\d,]/g, '').replace(',', '.'));
            matchRemun = remunMarcadas.some(opcao => {
                if (opcao === 'ate_800') return valorSalario <= 800;
                if (opcao === 'acima_800') return valorSalario > 800;
                return false;
            });
        }

        let matchData = true;
        if (datasMarcadas.length > 0) {
            matchData = datasMarcadas.some(opcao => {
                if (opcao === 'hoje') return job.time.includes('hora');
                if (opcao === 'semana') return job.time.includes('dia');
                return false;
            });
        }

        return matchesSearch && matchCidade && matchCurso && matchEmpresa && matchRemun && matchData;
    });

    filtered.forEach(job => {
        const isSaved = savedJobs.includes(job.id);
        const card = document.createElement("div");
        card.className = "job-card";
        card.id = `card-${job.id}`;

        const avatarUrl = `https://ui-avatars.com/api/?name=${job.company}&background=2d9669&color=fff`;

        card.innerHTML = `
      <img src="${avatarUrl}" alt="Logo">
      <div class="job-card-info" style="flex:1">
        <div style="display:flex; justify-content:space-between">
            <h4>${job.title}</h4>
            ${isSaved ? '<span style="color:#e91e63">♥</span>' : ''}
        </div>
        <p><strong>${job.company}</strong></p>
        <p>${job.location}</p>
        <small style="color: green">${job.time}</small>
      </div>
    `;

        card.onclick = () => {
            document.querySelectorAll(".job-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            showDetails(job);
        };
        listContainer.appendChild(card);
    });

    document.getElementById("count-label").innerText = `${filtered.length} vagas encontradas`;
}

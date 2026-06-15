let profileData = null;
let notificationsList = [];

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
    } else if (viewName === 'register') {
        document.getElementById('view-register-container').classList.add('active-view');
        document.getElementById('nav-cadastro').classList.add('active');
    } else if (viewName === 'notifications') {
        document.getElementById('view-notifications-container').classList.add('active-view');
        document.getElementById('nav-notifications').classList.add('active');
        fetchNotifications().then(() => renderNotifications());
    } else if (viewName === 'profile') {
        document.getElementById('view-profile-container').classList.add('active-view');
        document.getElementById('nav-perfil').classList.add('active');
        fetchProfile().then(data => {
            if (data) fillProfileForm(data);
            renderProfile();
        });
    }
}

async function fetchProfile() {
    try {
        const response = await fetch('/api/perfil');
        if (!response.ok) throw new Error('Erro ao carregar perfil');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            profileData = result.dados;
            return profileData;
        }
        return null;
    } catch (erro) {
        console.error(erro);
        return null;
    }
}

async function fetchNotifications() {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok) throw new Error('Erro ao carregar notificações');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            notificationsList = result.dados;
            return notificationsList;
        }
        return [];
    } catch (erro) {
        console.error(erro);
        return [];
    }
}

async function saveProfile(profile) {
    try {
        const response = await fetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar perfil');
        }
        profileData = result.dados;
        return profileData;
    } catch (erro) {
        console.error(erro);
        throw erro;
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

function renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;

    const notificationsToShow = notificationsList.length > 0 ? notificationsList : [];

    if (notificationsToShow.length === 0) {
        listContainer.innerHTML = '<p class="notification-empty">Nenhuma notificação disponível.</p>';
        return;
    }

    listContainer.innerHTML = notificationsToShow.map(notification => `
        <div class="notification-card">
            <div class="notification-header">
                <strong>${notification.title}</strong>
                <span>${notification.time}</span>
            </div>
            <p>${notification.message}</p>
        </div>
    `).join('');
}

function renderProfile() {
    if (!profileData) {
        fetchProfile().then(data => {
            if (!data) return;
            profileData = data;
            fillProfileForm(data);
        });
    } else {
        fillProfileForm(profileData);
    }

    const savedCountEl = document.getElementById('saved-jobs-count');
    if (savedCountEl) {
        savedCountEl.textContent = savedJobs.length;
    }
}

function fillProfileForm(profile) {
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileEmail').value = profile.email || '';
    document.getElementById('profileCourse').value = profile.course || '';
    document.getElementById('profileCampus').value = profile.campus || '';
    document.getElementById('profileStatus').value = profile.status || '';
    document.getElementById('profileAvailability').value = profile.availability || '';
}

function setProfileMessage(message, isError = true) {
    const profileMessage = document.getElementById('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}

function clearProfileMessage() {
    const profileMessage = document.getElementById('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = '';
}

async function handleSaveProfile() {
    const profile = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        course: document.getElementById('profileCourse').value.trim(),
        campus: document.getElementById('profileCampus').value.trim(),
        status: document.getElementById('profileStatus').value.trim(),
        availability: document.getElementById('profileAvailability').value.trim()
    };

    try {
        const saved = await saveProfile(profile);
        setProfileMessage('Perfil salvo com sucesso.', false);
        fillProfileForm(saved);
    } catch (erro) {
        setProfileMessage(erro.message || 'Não foi possível salvar o perfil.');
    }
}

function handleCancelProfile() {
    if (profileData) {
        fillProfileForm(profileData);
    }
    clearProfileMessage();
}

const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', handleSaveProfile);
}
if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', handleCancelProfile);
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

let profileData: Profile | null = null;
let notificationsList: NotificationItem[] = [];
let applicationIdsUserId: number | null = null;
let applicationJobIds = new Set<number>();
let pendingApplicationJobId: number | null = null;

interface StudentApplication {
    vagaId: number;
}

async function loadApplicationJobIds(userId: number): Promise<Set<number>> {
    if (applicationIdsUserId === userId) return applicationJobIds;

    const response = await authFetch('/api/candidaturas/minhas');
    const result = await response.json() as ApiResponse<StudentApplication[]>;
    if (!response.ok || !result.sucesso || !Array.isArray(result.dados)) {
        throw new Error(result.erro || 'Não foi possível verificar suas candidaturas.');
    }

    applicationIdsUserId = userId;
    applicationJobIds = new Set(result.dados.map(application => application.vagaId));
    return applicationJobIds;
}

async function refreshApplicationButton(jobId: number): Promise<void> {
    const user = window.authenticatedUser;
    const button = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
    if (!button || user?.role !== 'student') return;

    button.disabled = true;
    button.textContent = 'Verificando inscrição...';
    try {
        const appliedJobIds = await loadApplicationJobIds(user.id);
        const currentButton = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
        if (!currentButton) return;
        currentButton.disabled = appliedJobIds.has(jobId);
        currentButton.textContent = appliedJobIds.has(jobId) ? 'Você já se candidatou' : 'Candidatar-se';
    } catch (error) {
        console.error('Erro ao verificar candidatura:', error);
        const currentButton = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.textContent = 'Candidatar-se';
        }
    }
}

function openApplicationPanel(jobId: number): void {
    const job = jobs.find(item => item.id === jobId);
    if (!job) {
        alert('Não foi possível encontrar os dados desta vaga. Atualize a página e tente novamente.');
        return;
    }

    pendingApplicationJobId = job.id;
    getElement<HTMLFormElement>('applicationForm')?.reset();
    getElement<HTMLFormElement>('applicationForm')?.classList.remove('hidden');
    getElement('applicationSuccess')?.classList.add('hidden');
    const message = getElement<HTMLElement>('applicationFormMessage');
    if (message) message.textContent = '';
    const title = getElement<HTMLElement>('applicationTitle');
    if (title) title.textContent = 'Conte mais sobre você';
    const jobName = getElement<HTMLElement>('applicationJobName');
    if (jobName) jobName.textContent = `${job.title} · ${job.company}`;
    getElement('application-panel')?.classList.remove('hidden');
    getElement<HTMLTextAreaElement>('applicationSkills')?.focus();
}

function closeApplicationPanel(): void {
    getElement('application-panel')?.classList.add('hidden');
    getElement<HTMLFormElement>('applicationForm')?.reset();
    getElement<HTMLFormElement>('applicationForm')?.classList.remove('hidden');
    getElement('applicationSuccess')?.classList.add('hidden');
    const message = getElement<HTMLElement>('applicationFormMessage');
    if (message) message.textContent = '';
    pendingApplicationJobId = null;
}

function completeApplication(titleText: string, messageText: string): void {
    const title = getElement<HTMLElement>('applicationTitle');
    if (title) title.textContent = titleText;
    getElement<HTMLFormElement>('applicationForm')?.classList.add('hidden');
    const successTitle = getElement<HTMLElement>('applicationSuccessTitle');
    if (successTitle) successTitle.textContent = titleText;
    const successMessage = getElement<HTMLElement>('applicationSuccessMessage');
    if (successMessage) successMessage.textContent = messageText;
    getElement('applicationSuccess')?.classList.remove('hidden');
}

async function submitApplicationForm(event: Event): Promise<void> {
    event.preventDefault();
    const user = window.authenticatedUser;
    const message = getElement<HTMLElement>('applicationFormMessage');
    const submitButton = getElement<HTMLButtonElement>('submitApplicationBtn');
    if (!user || user.role !== 'student') {
        if (message) message.textContent = 'Entre com uma conta de estudante para enviar a candidatura.';
        return;
    }
    if (pendingApplicationJobId === null) {
        if (message) message.textContent = 'Selecione uma vaga antes de enviar a candidatura.';
        return;
    }

    const answers = {
        skills: getTextValue('applicationSkills'),
        experience: getTextValue('applicationExperience'),
        motivation: getTextValue('applicationMotivation'),
        availability: getTextValue('applicationAvailability'),
    };
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
    }
    if (message) message.textContent = '';

    try {
        const jobId = pendingApplicationJobId;
        const response = await authFetch('/api/candidaturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vagaId: jobId, answers }),
        });
        const result = await response.json() as ApiResponse<unknown>;
        if (response.status === 409) {
            if (applicationIdsUserId !== user.id) applicationJobIds = new Set<number>();
            applicationIdsUserId = user.id;
            applicationJobIds.add(jobId);
            const applyButton = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
            if (applyButton) {
                applyButton.disabled = true;
                applyButton.textContent = 'Você já se candidatou';
            }
            completeApplication('Candidatura já registrada', 'Você já se candidatou a esta vaga.');
            return;
        }
        if (!response.ok) throw new Error(result.erro || 'Não foi possível enviar sua candidatura.');

        if (applicationIdsUserId !== user.id) applicationJobIds = new Set<number>();
        applicationIdsUserId = user.id;
        applicationJobIds.add(jobId);
        const applyButton = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
        if (applyButton) {
            applyButton.disabled = true;
            applyButton.textContent = 'Candidatura enviada';
        }
        completeApplication('Candidatura enviada!', 'Suas respostas foram enviadas para a empresa.');
    } catch (error) {
        console.error('Erro ao enviar candidatura:', error);
        if (message) message.textContent = error instanceof Error ? error.message : 'Não foi possível enviar sua candidatura.';
    } finally {
        const form = getElement<HTMLFormElement>('applicationForm');
        if (submitButton && form && !form.classList.contains('hidden')) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar candidatura';
        }
    }
}

async function applyToJob(jobId: number): Promise<void> {
    const user = window.authenticatedUser;
    if (!user) {
        openAuthPanel();
        return;
    }
    if (user.role !== 'student') {
        alert('Apenas estudantes podem se candidatar a vagas.');
        return;
    }
    const button = getElement<HTMLButtonElement>(`apply-job-${jobId}`);
    if (button?.disabled) return;
    openApplicationPanel(jobId);
}

window.applyToJob = applyToJob;
getElement<HTMLFormElement>('applicationForm')?.addEventListener('submit', submitApplicationForm);
getElement('closeApplicationBtn')?.addEventListener('click', closeApplicationPanel);
getElement('cancelApplicationBtn')?.addEventListener('click', closeApplicationPanel);
getElement('finishApplicationBtn')?.addEventListener('click', closeApplicationPanel);

async function carregarVagas() {
    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok) throw new Error('Erro ao carregar vagas');
        const resultado = await resposta.json() as ApiResponse<Job[]>;
        
        // A API retorna { sucesso: true, quantidade: X, dados: [...] }
        if (resultado.sucesso && resultado.dados) {
            jobs = resultado.dados;
            console.log(`✅ ${jobs.length} vagas carregadas`);
        } else {
            jobs = [];
            throw new Error('Resposta inválida da API');
        }
        
        renderJobs();
    } catch (erro) {
        console.error('❌ Erro ao carregar vagas:', erro);
        const countLabel = getElement<HTMLElement>('count-label');
        if (countLabel) countLabel.innerText = 'Erro ao carregar vagas';
    }
}

function switchView(viewName: string) {
    document.querySelectorAll<HTMLElement>('.view-section').forEach(el => el.classList.remove('active-view'));
    document.querySelectorAll<HTMLElement>('nav a').forEach(el => el.classList.remove('active'));

    const viewJobsContainer = getElement<HTMLElement>('view-jobs-container');
    const navVagas = getElement<HTMLElement>('nav-vagas');
    const viewRegisterContainer = getElement<HTMLElement>('view-register-container');
    const navCadastro = getElement<HTMLElement>('nav-cadastro');
    const viewNotificationsContainer = getElement<HTMLElement>('view-notifications-container');
    const navNotifications = getElement<HTMLElement>('nav-notifications');
    const viewProfileContainer = getElement<HTMLElement>('view-profile-container');
    const navPerfil = getElement<HTMLElement>('nav-perfil');

    if (viewName === 'jobs') {
        viewJobsContainer?.classList.add('active-view');
        navVagas?.classList.add('active');
        carregarVagas();
    } else if (viewName === 'register') {
        if (!isAuthenticated()) { openAuthPanel(); return; }
        viewRegisterContainer?.classList.add('active-view');
        navCadastro?.classList.add('active');
    } else if (viewName === 'notifications') {
        viewNotificationsContainer?.classList.add('active-view');
        navNotifications?.classList.add('active');
        fetchNotifications().then(() => renderNotifications());
    } else if (viewName === 'profile') {
        if (!isAuthenticated()) { openAuthPanel(); return; }
        viewProfileContainer?.classList.add('active-view');
        navPerfil?.classList.add('active');
        fetchProfile().then(data => {
            if (data) fillProfileForm(data);
            renderProfile();
        });
    }
}

async function fetchProfile(): Promise<Profile | null> {
    try {
        const response = await authFetch('/api/perfil');
        if (!response.ok) throw new Error('Erro ao carregar perfil');
        const result = await response.json() as ApiResponse<Profile>;
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

async function fetchNotifications(): Promise<NotificationItem[]> {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok) throw new Error('Erro ao carregar notificações');
        const result = await response.json() as ApiResponse<NotificationItem[]>;
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

async function saveProfile(profile: Profile): Promise<Profile> {
    try {
        const response = await authFetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const result = await response.json() as ApiResponse<Profile>;
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar perfil');
        }
        profileData = result.dados ?? null;
        return profileData as Profile;
    } catch (erro) {
        console.error(erro);
        throw erro;
    }
}

function handleSearch() {
    renderJobs();
}

function showDetails(job: Job) {
    const isSaved = savedJobs.includes(job.id);
    const reqList = Array.isArray(job.requirements)
        ? job.requirements.map((r: string) => `<li>${r}</li>`).join("")
        : `<li>${job.requirements}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map((b: string) => `<li>${b}</li>`).join("")
        : job.benefits ? `<li>${job.benefits}</li>` : '<li>Nenhum benefício listado</li>';
    const role = window.authenticatedUser?.role || localStorage.getItem('impulsiona_role_choice');
    const isCompany = role === 'company';
    const managementActions = isCompany
        ? `<button class="btn-action" onclick="startJobEdit(${job.id})">Editar</button>
           <button class="btn-action btn-delete" onclick="deleteJob(${job.id})">Excluir</button>`
        : '';
    const applicationAction = isCompany ? '' :
        `<button id="apply-job-${job.id}" class="btn-action btn-apply" onclick="applyToJob(${job.id})">
           ${window.authenticatedUser?.role === 'student' ? 'Candidatar-se' : 'Entrar para se candidatar'}
         </button>`;

    const jobDetails = getElement<HTMLElement>('job-details');
    if (!jobDetails) return;
    jobDetails.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <p class="detail-eyebrow">Oportunidade disponível</p>
          <h2>${job.title}</h2>
          <h4>${job.company}</h4>
          <p class="detail-meta">${job.location} · <strong>${job.salary}</strong></p>
          <p class="detail-email">E-mail: ${job.email || 'Não informado'}</p>
        </div>
        <div class="detail-actions">
          ${managementActions}
          ${applicationAction}
          <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
            ${isSaved ? '♥ Salvo' : '♡ Salvar Vaga'}
          </button>
        </div>
      </div>
      <div class="detail-badges">
        <span class="tag">${job.target}</span>
        <span class="tag">${job.type}</span>
      </div>
      <div class="info-block">
        <h4>Sobre a Vaga</h4>
        <p style="color:#555; line-height:1.6; margin:0">${job.desc}</p>
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
    void refreshApplicationButton(job.id);
}

function toggleSave(jobId: number) {
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
    } else if (profileData) {
        fillProfileForm(profileData);
    }

    const savedCountEl = getElement<HTMLElement>('saved-jobs-count');
    if (savedCountEl) {
        savedCountEl.textContent = String(savedJobs.length);
    }
}

function fillProfileForm(profile: Profile) {
    getInputElement('profileName')!.value = profile.name || '';
    getInputElement('profileEmail')!.value = profile.email || '';
    getInputElement('profileCourse')!.value = profile.course || '';
    getInputElement('profileCampus')!.value = profile.campus || '';
    getInputElement('profileStatus')!.value = profile.status || '';
    getInputElement('profileAvailability')!.value = profile.availability || '';
}

function setProfileMessage(message: string, isError = true) {
    const profileMessage = getElement<HTMLElement>('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}

function clearProfileMessage() {
    const profileMessage = getElement<HTMLElement>('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = '';
}

async function handleSaveProfile() {
    const profile: Profile = {
        name: getInputValue('profileName'),
        email: getInputValue('profileEmail'),
        course: getInputValue('profileCourse'),
        campus: getInputValue('profileCampus'),
        status: getInputValue('profileStatus'),
        availability: getInputValue('profileAvailability')
    };

    try {
        const saved = await saveProfile(profile);
        setProfileMessage('Perfil salvo com sucesso.', false);
        fillProfileForm(saved);
    } catch (erro) {
        const message = erro instanceof Error ? erro.message : String(erro);
        setProfileMessage(message || 'Não foi possível salvar o perfil.');
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
    const listContainer = getElement<HTMLElement>('job-list');
    const searchText = getInputValue('jobSearch').toLowerCase();
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const cidadesMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="cidade"]:checked')).map(cb => cb.value);
    const cursosMarcados = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="curso"]:checked')).map(cb => cb.value);
    const empresasMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="empresa"]:checked')).map(cb => cb.value);
    const remunMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="remuneracao"]:checked')).map(cb => cb.value);
    const datasMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="data"]:checked')).map(cb => cb.value);

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

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <h4>Nenhuma vaga encontrada</h4>
                <p>Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
        `;
        const countLabel = getElement<HTMLElement>('count-label');
        if (countLabel) countLabel.innerText = '0 vagas encontradas';
        return;
    }

    filtered.forEach(job => {
        const isSaved = savedJobs.includes(job.id);
        const card = document.createElement("div");
        card.className = "job-card";
        card.id = `card-${job.id}`;

        const avatarUrl = `https://ui-avatars.com/api/?name=${job.company}&background=2d9669&color=fff`;

        card.innerHTML = `
      <img src="${avatarUrl}" alt="Logo">
      <div class="job-card-info">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <h4>${job.title}</h4>
            ${isSaved ? '<span style="color:#e91e63; font-size:1.1rem;">♥</span>' : ''}
        </div>
        <p><strong>${job.company}</strong></p>
        <p>${job.location}</p>
        <small style="color:#2d9669; font-weight:600">${job.time}</small>
      </div>
    `;

        card.onclick = () => {
            document.querySelectorAll(".job-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            showDetails(job);
        };
        listContainer.appendChild(card);
    });

    const countLabel = getElement<HTMLElement>('count-label');
    if (countLabel) countLabel.innerText = `${filtered.length} vagas encontradas`;
}

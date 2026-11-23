"use strict";
let profileData = null;
let notificationsList = [];
let applicationIdsUserId = null;
let applicationJobIds = new Set();
let pendingApplicationJobId = null;

async function loadApplicationJobIds(userId) {
    if (applicationIdsUserId === userId)
        return applicationJobIds;
    const response = await authFetch('/api/candidaturas/minhas');
    const result = await response.json();
    if (!response.ok || !result.sucesso || !Array.isArray(result.dados)) {
        throw new Error(result.erro || 'Não foi possível verificar suas candidaturas.');
    }
    applicationIdsUserId = userId;
    applicationJobIds = new Set(result.dados.map(application => application.vagaId));
    return applicationJobIds;
}
async function refreshApplicationButton(jobId) {
    const user = window.authenticatedUser;
    const button = getElement(`apply-job-${jobId}`);
    if (!button || user?.role !== 'student')
        return;
    button.disabled = true;
    button.textContent = 'Verificando inscrição...';
    try {
        const appliedJobIds = await loadApplicationJobIds(user.id);
        const currentButton = getElement(`apply-job-${jobId}`);
        if (!currentButton)
            return;
        currentButton.disabled = appliedJobIds.has(jobId);
        currentButton.textContent = appliedJobIds.has(jobId) ? 'Você já se candidatou' : 'Candidatar-se';
    }
    catch (error) {
        console.error('Erro ao verificar candidatura:', error);
        const currentButton = getElement(`apply-job-${jobId}`);
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.textContent = 'Candidatar-se';
        }
    }
}
function openApplicationPanel(jobId) {
    const job = jobs.find(item => item.id === jobId);
    if (!job) {
        alert('Não foi possível encontrar os dados desta vaga. Atualize a página e tente novamente.');
        return;
    }

    pendingApplicationJobId = job.id;
    getElement('applicationForm')?.reset();
    getElement('applicationForm')?.classList.remove('hidden');
    getElement('applicationSuccess')?.classList.add('hidden');
    getElement('applicationFormMessage').textContent = '';
    getElement('applicationTitle').textContent = 'Conte mais sobre você';
    getElement('applicationJobName').textContent = `${job.title} · ${job.company}`;
    getElement('application-panel').classList.remove('hidden');
    getElement('applicationSkills').focus();
}
function closeApplicationPanel() {
    getElement('application-panel')?.classList.add('hidden');
    getElement('applicationForm')?.reset();
    getElement('applicationForm')?.classList.remove('hidden');
    getElement('applicationSuccess')?.classList.add('hidden');
    getElement('applicationFormMessage').textContent = '';
    pendingApplicationJobId = null;
}
function completeApplication(title, message) {
    getElement('applicationTitle').textContent = title;
    getElement('applicationForm')?.classList.add('hidden');
    getElement('applicationSuccessTitle').textContent = title;
    getElement('applicationSuccessMessage').textContent = message;
    getElement('applicationSuccess').classList.remove('hidden');
}
async function submitApplicationForm(event) {
    event.preventDefault();
    const user = window.authenticatedUser;
    const message = getElement('applicationFormMessage');
    const submitButton = getElement('submitApplicationBtn');
    if (!user || user.role !== 'student') {
        if (message)
            message.textContent = 'Entre com uma conta de estudante para enviar a candidatura.';
        return;
    }
    if (pendingApplicationJobId === null) {
        if (message)
            message.textContent = 'Selecione uma vaga antes de enviar a candidatura.';
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
    if (message)
        message.textContent = '';

    try {
        const jobId = pendingApplicationJobId;
        const response = await authFetch('/api/candidaturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vagaId: jobId, answers }),
        });
        const result = await response.json();
        if (response.status === 409) {
            if (applicationIdsUserId !== user.id)
                applicationJobIds = new Set();
            applicationIdsUserId = user.id;
            applicationJobIds.add(jobId);
            const applyButton = getElement(`apply-job-${jobId}`);
            if (applyButton) {
                applyButton.disabled = true;
                applyButton.textContent = 'Você já se candidatou';
            }
            completeApplication('Candidatura já registrada', 'Você já se candidatou a esta vaga.');
            return;
        }
        if (!response.ok)
            throw new Error(result.erro || 'Não foi possível enviar sua candidatura.');

        if (applicationIdsUserId !== user.id)
            applicationJobIds = new Set();
        applicationIdsUserId = user.id;
        applicationJobIds.add(jobId);
        const applyButton = getElement(`apply-job-${jobId}`);
        if (applyButton) {
            applyButton.disabled = true;
            applyButton.textContent = 'Candidatura enviada';
        }
        completeApplication('Candidatura enviada!', 'Suas respostas foram enviadas para a empresa.');
    } catch (error) {
        console.error('Erro ao enviar candidatura:', error);
        if (message)
            message.textContent = error instanceof Error ? error.message : 'Não foi possível enviar sua candidatura.';
    } finally {
        if (submitButton && !getElement('applicationForm').classList.contains('hidden')) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar candidatura';
        }
    }
}
async function applyToJob(jobId) {
    const user = window.authenticatedUser;
    if (!user) {
        openAuthPanel();
        return;
    }
    if (user.role !== 'student') {
        alert('Apenas estudantes podem se candidatar a vagas.');
        return;
    }
    const button = getElement(`apply-job-${jobId}`);
    if (button?.disabled)
        return;
    openApplicationPanel(jobId);
}
window.applyToJob = applyToJob;
getElement('applicationForm')?.addEventListener('submit', submitApplicationForm);
getElement('closeApplicationBtn')?.addEventListener('click', closeApplicationPanel);
getElement('cancelApplicationBtn')?.addEventListener('click', closeApplicationPanel);
getElement('finishApplicationBtn')?.addEventListener('click', closeApplicationPanel);

// Helper: determine if a notification is a student-targeted broadcast
function isStudentBroadcast(notification) {
    const text = ((notification.title || '') + ' ' + (notification.message || '')).toLowerCase();
    // Patterns that indicate general student broadcasts
    const patterns = [
        'nova vaga recomendada',
        'recado do campus',
        'atualize seu perfil',
        'novas oportunidades',
        'prazo final para inscrição',
        'prazo final para inscrição',
        'inscrições',
        'inscrição',
        'atualize seu perfil',
        'atualize seu cadastro',
        'oportunidade em',
        'oportunidades no curso'
    ];
    return patterns.some(p => text.includes(p));
}

// Allow companies to delete notifications by id
async function deleteNotification(id) {
    if (!confirm('Deseja realmente excluir esta notificação?')) return;
    try {
        const resp = await authFetch(`/api/notificacoes/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error('Falha ao excluir');
        // remove from local list and re-render
        notificationsList = notificationsList.filter(n => n.id !== id);
        renderNotifications();
    }
    catch (err) {
        console.error('Erro ao excluir notificação', err);
        alert('Não foi possível excluir a notificação.');
    }
}
async function carregarVagas() {
    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok)
            throw new Error('Erro ao carregar vagas');
        const resultado = await resposta.json();
        // A API retorna { sucesso: true, quantidade: X, dados: [...] }
        if (resultado.sucesso && resultado.dados) {
            jobs = resultado.dados;
            console.log(`✅ ${jobs.length} vagas carregadas`);
        }
        else {
            jobs = [];
            throw new Error('Resposta inválida da API');
        }
        renderJobs();
    }
    catch (erro) {
        console.error('❌ Erro ao carregar vagas:', erro);
        const countLabel = getElement('count-label');
        if (countLabel)
            countLabel.innerText = 'Erro ao carregar vagas';
    }
}
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    const viewJobsContainer = getElement('view-jobs-container');
    const navVagas = getElement('nav-vagas');
    const viewRegisterContainer = getElement('view-register-container');
    const navCadastro = getElement('nav-cadastro');
    const viewNotificationsContainer = getElement('view-notifications-container');
    const navNotifications = getElement('nav-notifications');
    const viewProfileContainer = getElement('view-profile-container');
    const navPerfil = getElement('nav-perfil');
    if (viewName === 'jobs') {
        viewJobsContainer?.classList.add('active-view');
        navVagas?.classList.add('active');
        carregarVagas();
    }
    else if (viewName === 'register') {
        if (!isAuthenticated()) {
            // open auth panel in register mode (shows role selection)
            openAuthPanel(true);
            return;
        }
        // Determine role: prefer logged user, fallback to stored choice
        const role = window.authenticatedUser?.role || localStorage.getItem('impulsiona_role_choice');
        if (role !== 'company') {
            alert('Apenas empresas podem cadastrar vagas. Faça login como empresa.');
            return;
        }
        viewRegisterContainer?.classList.add('active-view');
        navCadastro?.classList.add('active');
    }
    else if (viewName === 'notifications') {
        viewNotificationsContainer?.classList.add('active-view');
        navNotifications?.classList.add('active');
        fetchNotifications().then(() => renderNotifications());
    }
    else if (viewName === 'profile') {
        if (!isAuthenticated()) {
            openAuthPanel();
            return;
        }
        viewProfileContainer?.classList.add('active-view');
        navPerfil?.classList.add('active');
        fetchProfile().then(data => {
            if (data)
                fillProfileForm(data);
            renderProfile();
        });
    }
}
async function fetchProfile() {
    try {
        const response = await authFetch('/api/perfil');
        if (!response.ok)
            throw new Error('Erro ao carregar perfil');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            profileData = result.dados;
            return profileData;
        }
        return null;
    }
    catch (erro) {
        console.error(erro);
        return null;
    }
}
async function fetchNotifications() {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok)
            throw new Error('Erro ao carregar notificações');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            notificationsList = result.dados;
            return notificationsList;
        }
        return [];
    }
    catch (erro) {
        console.error(erro);
        return [];
    }
}
async function saveProfile(profile) {
    try {
        const response = await authFetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar perfil');
        }
        profileData = result.dados ?? null;
        return profileData;
    }
    catch (erro) {
        console.error(erro);
        throw erro;
    }
}
// Ensure profile form fields visibility reflects current role
function updateProfileFormVisibility(role) {
    const nameInput = getInputElement('profileName');
    const nameLabel = nameInput?.parentElement?.querySelector('label');
    const courseInput = getElement('profileCourse');
    const campusInput = getElement('profileCampus');
    const courseField = courseInput?.parentElement;
    const campusField = campusInput?.parentElement;
    if (role === 'company') {
        if (nameLabel) nameLabel.textContent = 'Nome da Empresa';
        if (courseField) courseField.style.display = 'none';
        if (campusField) campusField.style.display = 'none';
        if (courseInput) courseInput.required = false;
        if (campusInput) campusInput.required = false;
    }
    else {
        if (nameLabel) nameLabel.textContent = 'Nome completo';
        if (courseField) courseField.style.display = '';
        if (campusField) campusField.style.display = '';
        if (courseInput) courseInput.required = true;
        if (campusInput) campusInput.required = true;
    }
}
window.updateProfileFormVisibility = updateProfileFormVisibility;
function handleSearch() {
    renderJobs();
}
function showDetails(job) {
    const isSaved = savedJobs.includes(job.id);
    const reqList = Array.isArray(job.requirements)
        ? job.requirements.map((r) => `<li>${r}</li>`).join("")
        : `<li>${job.requirements}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map((b) => `<li>${b}</li>`).join("")
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
    const jobDetails = getElement('job-details');
    if (!jobDetails)
        return;
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
function toggleSave(jobId) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    }
    else {
        savedJobs.push(jobId);
    }
    localStorage.setItem("ifpb_saved", JSON.stringify(savedJobs));
    renderJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job)
        showDetails(job);
}
function renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer)
        return;
    const notificationsToShow = notificationsList.length > 0 ? notificationsList : [];
    if (notificationsToShow.length === 0) {
        listContainer.innerHTML = '<p class="notification-empty">Nenhuma notificação disponível.</p>';
        return;
    }
    const role = window.authenticatedUser?.role || localStorage.getItem('impulsiona_role_choice');
    // If company, filter out student-targeted broadcasts
    const filtered = role === 'company'
        ? notificationsToShow.filter(n => !isStudentBroadcast(n))
        : notificationsToShow;

    listContainer.innerHTML = filtered.map(notification => {
        // If user is a company, try to render application notifications as student candidatures
        if (role === 'company') {
            const lower = (notification.title + ' ' + notification.message).toLowerCase();
            if (lower.includes('candid') || lower.includes('inscr') || lower.includes('inscrição') || lower.includes('candidato')) {
                // Attempt to parse candidate name, course and campus from message
                const knownCourses = ['Informática', 'Eletrotécnica', 'Mecânica', 'Edificações'];
                const knownCampuses = ['João Pessoa', 'Campina Grande', 'Cajazeiras'];
                let candidateName = '';
                // Try to find "Nome: X" or "Aluno X"
                const nameMatch = notification.message.match(/Nome[:\-]\s*([A-ZÀ-ÿ\w\s]+)/i) || notification.message.match(/Aluno[:\-]\s*([A-ZÀ-ÿ\w\s]+)/i) || notification.message.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+\s[A-ZÀ-ÿ][a-zà-ÿ]+)/);
                if (nameMatch) candidateName = (nameMatch[1] || nameMatch[0]).trim();
                // find course and campus if present
                let foundCourse = knownCourses.find(c => notification.message.includes(c)) || knownCourses.find(c => notification.title.includes(c)) || '';
                let foundCampus = knownCampuses.find(c => notification.message.includes(c)) || knownCampuses.find(c => notification.title.includes(c)) || '';
                // Fallback: try regex for campus mention
                if (!foundCampus) {
                    const campusMatch = notification.message.match(/campus\s+([A-Za-z\s]+)/i);
                    if (campusMatch) foundCampus = campusMatch[1].trim();
                }
                const avatar = candidateName ? candidateName.charAt(0).toUpperCase() : 'A';
                return `
                    <div class="notification-card">
                        <div class="notification-header">
                            <strong>Nova candidatura</strong>
                            <span>${notification.time}</span>
                        </div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <div style="width:48px;height:48px;border-radius:24px;background:#2d9669;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">${avatar}</div>
                            <div>
                                <div style="font-weight:700">${candidateName || 'Candidato anônimo'}</div>
                                <div style="color:#444">${foundCourse ? `Curso: ${foundCourse}` : ''} ${foundCampus ? `· Campus: ${foundCampus}` : ''}</div>
                                <div style="margin-top:6px;color:#333">${notification.message}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        // Default render (no delete for companies)
        return `
            <div class="notification-card">
                <div class="notification-header">
                    <strong>${notification.title}</strong>
                    <span>${notification.time}</span>
                </div>
                <p>${notification.message}</p>
            </div>
        `;
    }).join('');
}
function renderProfile() {
    if (!profileData) {
        fetchProfile().then(data => {
            if (!data)
                return;
            profileData = data;
            fillProfileForm(data);
        });
    }
    else if (profileData) {
        fillProfileForm(profileData);
    }
    const savedCountEl = getElement('saved-jobs-count');
    if (savedCountEl) {
        savedCountEl.textContent = String(savedJobs.length);
    }
}
function fillProfileForm(profile) {
    const role = window.authenticatedUser?.role || localStorage.getItem('impulsiona_role_choice');
    // Apply visibility first so fields like required/display are correct
    updateProfileFormVisibility(role);
    const nameInput = getInputElement('profileName');
    if (nameInput) nameInput.value = profile.name || '';
    getInputElement('profileEmail').value = profile.email || '';
    getInputElement('profileCourse').value = profile.course || '';
    getInputElement('profileCampus').value = profile.campus || '';
    getInputElement('profileStatus').value = profile.status || '';
    getInputElement('profileAvailability').value = profile.availability || '';
    // Update sidebar summary lines
    const roleLine = document.getElementById('profileRoleLine');
    const campusLine = document.getElementById('profileCampusLine');
    if (role === 'company') {
        if (roleLine) roleLine.textContent = 'Empresa';
        if (campusLine) campusLine.textContent = profile.location || '';
    }
    else {
        if (roleLine) roleLine.textContent = profile.course ? `Estudante de ${profile.course}` : 'Estudante';
        if (campusLine) campusLine.textContent = profile.campus ? `IFPB - Campus ${profile.campus}` : '';
    }
}
function setProfileMessage(message, isError = true) {
    const profileMessage = getElement('profileMessage');
    if (!profileMessage)
        return;
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}
function clearProfileMessage() {
    const profileMessage = getElement('profileMessage');
    if (!profileMessage)
        return;
    profileMessage.textContent = '';
}
async function handleSaveProfile() {
    const profile = {
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
    }
    catch (erro) {
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
    const listContainer = getElement('job-list');
    const searchText = getInputValue('jobSearch').toLowerCase();
    if (!listContainer)
        return;
    listContainer.innerHTML = "";
    const cidadesMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="cidade"]:checked')).map(cb => cb.value);
    const cursosMarcados = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="curso"]:checked')).map(cb => cb.value);
    const empresasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="empresa"]:checked')).map(cb => cb.value);
    const remunMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="remuneracao"]:checked')).map(cb => cb.value);
    const datasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="data"]:checked')).map(cb => cb.value);
    let filteredJobs = jobs.filter(job => {
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
                if (opcao === 'ate_800')
                    return valorSalario <= 800;
                if (opcao === 'acima_800')
                    return valorSalario > 800;
                return false;
            });
        }
        let matchData = true;
        if (datasMarcadas.length > 0) {
            matchData = datasMarcadas.some(opcao => {
                if (opcao === 'hoje')
                    return job.time.includes('hora');
                if (opcao === 'semana')
                    return job.time.includes('dia');
                return false;
            });
        }
        return matchesSearch && matchCidade && matchCurso && matchEmpresa && matchRemun && matchData;
    });
    // If current user is a company, show only jobs from that company
    const role = window.authenticatedUser?.role || localStorage.getItem('impulsiona_role_choice');
    if (role === 'company' && window.authenticatedUser?.name) {
        filteredJobs = filteredJobs.filter(j => String(j.company || '').trim() === String(window.authenticatedUser.name || '').trim());
    }
    if (filteredJobs.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <h4>Nenhuma vaga encontrada</h4>
                <p>Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
        `;
        const countLabel = getElement('count-label');
        if (countLabel)
            countLabel.innerText = '0 vagas encontradas';
        return;
    }
    filteredJobs.forEach(job => {
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
    const countLabel = getElement('count-label');
    if (countLabel)
        countLabel.innerText = `${filteredJobs.length} vagas encontradas`;
}

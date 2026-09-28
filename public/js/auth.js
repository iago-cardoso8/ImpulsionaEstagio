"use strict";
let authenticatedUser = null;
const ROLE_STORAGE_KEY = 'impulsiona_role_choice';
let authToastTimer;
function isAuthenticated() { return Boolean(localStorage.getItem('impulsiona_token')); }
function clearAuthSession(message) {
    localStorage.removeItem('impulsiona_token');
    localStorage.removeItem('impulsiona_user');
    setAuthState(null);
    if (message) {
        openAuthPanel(false);
        setAuthMessage(message);
    }
}
function authFetch(input, init = {}) {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('impulsiona_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers }).then((response) => {
        if (response.status === 401) {
            clearAuthSession(token ? 'Sua sessão expirou. Entre novamente.' : 'Entre para continuar.');
        }
        return response;
    });
}
function setAuthState(user, token) {
    authenticatedUser = user;
    // expose on window for other modules
    window.authenticatedUser = user;
    if (token)
        localStorage.setItem('impulsiona_token', token);
    if (user)
        localStorage.setItem('impulsiona_user', JSON.stringify(user));
    else
        localStorage.removeItem('impulsiona_user');
    const label = document.getElementById('authUserLabel');
    const action = document.getElementById('authActionBtn');
    if (label)
        label.textContent = user ? `Olá, ${user.name}` : 'Visitante';
    if (action)
        action.textContent = user ? 'Sair' : 'Entrar';
    // show or hide the "Ainda não tenho cadastro" toggle depending on auth state
    const toggle = document.getElementById('authToggleBtn');
    if (toggle) {
        toggle.style.display = user ? 'none' : 'inline-block';
    }
    const profileName = document.getElementById('profileDisplayName');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileName)
        profileName.textContent = user?.name || 'Visitante';
    if (profileAvatar)
        profileAvatar.textContent = user?.name?.charAt(0).toUpperCase() || '?';
    // update profile sidebar role lines
    const roleLine = document.getElementById('profileRoleLine');
    const campusLine = document.getElementById('profileCampusLine');
    if (roleLine) {
        if (user && user.role === 'company')
            roleLine.textContent = 'Empresa';
        else if (user && user.role === 'student')
            roleLine.textContent = 'Aluno';
        else if (!user && localStorage.getItem(ROLE_STORAGE_KEY))
            roleLine.textContent = localStorage.getItem(ROLE_STORAGE_KEY) === 'company' ? 'Empresa (visitante)' : 'Aluno (visitante)';
        else
            roleLine.textContent = '';
    }
    if (campusLine) {
        if (user && user.campus)
            campusLine.textContent = `IFPB - Campus ${user.campus}`;
        else
            campusLine.textContent = '';
    }
    document.querySelectorAll('[data-auth-required]').forEach(element => {
        element.classList.toggle('auth-disabled', !user);
    });
    // Mostrar/ocultar elementos específicos por papel
    document.querySelectorAll('.company-only').forEach(el => {
        if (user && user.role === 'company') el.classList.remove('hidden'); else el.classList.add('hidden');
    });
    document.querySelectorAll('.student-only').forEach(el => {
        if (user && user.role === 'student') el.classList.remove('hidden'); else el.classList.add('hidden');
    });
    // If logged in, prefer user's role over previous choice
    if (user && user.role) {
        localStorage.setItem(ROLE_STORAGE_KEY, user.role);
    }
    // update role badge
    const badge = document.getElementById('authRoleBadge');
    if (badge) {
        if (user && user.role) {
            badge.textContent = user.role === 'company' ? 'Empresa' : 'Aluno';
            badge.classList.remove('hidden');
        }
        else if (!user && localStorage.getItem(ROLE_STORAGE_KEY)) {
            const r = localStorage.getItem(ROLE_STORAGE_KEY);
            badge.textContent = r === 'company' ? 'Empresa (visitante)' : 'Aluno (visitante)';
            badge.classList.remove('hidden');
        }
        else {
            badge.classList.add('hidden');
        }
    }
    // ensure profile form visibility updates immediately on login/logout
    try {
        const currentRole = user?.role || localStorage.getItem(ROLE_STORAGE_KEY);
        if (typeof window.updateProfileFormVisibility === 'function')
            window.updateProfileFormVisibility(currentRole);
    }
    catch (e) { /* ignore */ }
}
function setAuthMessage(message, error = true) {
    const target = document.getElementById('authMessage');
    if (target) {
        target.textContent = message;
        target.style.color = error ? '#b00020' : '#1f8a3d';
    }
}
function showAuthToast(message, success) {
    const toast = document.getElementById('authToast');
    const text = document.getElementById('authToastMessage');
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.toggle('auth-toast--warning', !success);
    toast.classList.remove('hidden');
    clearTimeout(authToastTimer);
    authToastTimer = setTimeout(() => toast.classList.add('hidden'), 6000);
}
const authFieldElements = {
    name: ['authName', 'authNameError'],
    email: ['authEmail', 'authEmailError'],
    password: ['authPassword', 'authPasswordError'],
    course: ['authCourse', 'authCourseError'],
    campus: ['authCampus', 'authCampusError'],
};
function setAuthFieldError(field, message) {
    const fieldIds = authFieldElements[field];
    if (!fieldIds) return false;
    const [inputId, errorId] = fieldIds;
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return false;
    input.setCustomValidity(message);
    input.classList.toggle('is-invalid', Boolean(message));
    input.toggleAttribute('aria-invalid', Boolean(message));
    error.textContent = message;
    error.classList.toggle('hidden', !message);
    return true;
}
function clearAuthFieldErrors() {
    Object.keys(authFieldElements).forEach(field => setAuthFieldError(field, ''));
}
function setAuthEmailError(message) {
    setAuthFieldError('email', message);
}
function updateConfirmPasswordValidity() {
    const password = document.getElementById('authPassword');
    const confirmation = document.getElementById('authConfirmPassword');
    const error = document.getElementById('authConfirmPasswordError');
    if (!password || !confirmation || !error) return;
    const message = confirmation.required && confirmation.value && confirmation.value !== password.value
        ? 'As senhas não coincidem.'
        : '';
    confirmation.setCustomValidity(message);
    error.textContent = message;
    error.classList.toggle('hidden', !message);
}
async function loadAuthState() {
    if (!isAuthenticated())
        return;
    try {
        const response = await authFetch('/api/auth/me');
        if (!response.ok)
            return;
        const result = await response.json();
        if (result.usuario)
            setAuthState({ ...result.usuario, course: result.perfil?.course, campus: result.perfil?.campus });
        else
            clearAuthSession('Entre novamente para continuar.');
    }
    catch (error) {
        console.error('Não foi possível validar a sessão:', error);
    }
}

function applyRoleChoice(role) {
    if (!role) return;
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    document.querySelectorAll('.company-only').forEach(el => {
        if (role === 'company') el.classList.remove('hidden'); else el.classList.add('hidden');
    });
    document.querySelectorAll('.student-only').forEach(el => {
        if (role === 'student') el.classList.remove('hidden'); else el.classList.add('hidden');
    });
    // update role badge when not logged
    const badge = document.getElementById('authRoleBadge');
    if (badge && !isAuthenticated()) {
        badge.textContent = role === 'company' ? 'Empresa (visitante)' : 'Aluno (visitante)';
        badge.classList.remove('hidden');
    }
}

function showRoleSelectorIfNeeded() {
    if (isAuthenticated()) return;
    // Always show selector for unauthenticated users
    document.getElementById('role-select-panel')?.classList.remove('hidden');
}

async function logout() {
    try {
        const response = await authFetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
            if (response.status !== 401) alert('Não foi possível encerrar a sessão no servidor.');
            return;
        }
        clearAuthSession();
        switchView('jobs');
    }
    catch {
        alert('Não foi possível conectar ao servidor para encerrar a sessão.');
    }
}

document.getElementById('choose-student')?.addEventListener('click', () => {
    applyRoleChoice('student');
    document.getElementById('role-select-panel')?.classList.add('hidden');
    // open registration panel with student preselected and hide role radios
    openAuthPanel(true, 'student');
});
document.getElementById('choose-company')?.addEventListener('click', () => {
    applyRoleChoice('company');
    document.getElementById('role-select-panel')?.classList.add('hidden');
    // open registration panel with company preselected and hide role radios
    openAuthPanel(true, 'company');
});
document.getElementById('role-close')?.addEventListener('click', () => document.getElementById('role-select-panel')?.classList.add('hidden'));

function openAuthPanel(register = false, preselectedRole = null) {
    // preselectedRole: 'student'|'company' or null
    document.getElementById('auth-panel')?.classList.remove('hidden');
    document.getElementById('authTitle').textContent = register ? 'Criar conta' : 'Entrar';
    document.getElementById('authNameField')?.classList.toggle('hidden', !register);
    const nameInput = document.getElementById('authName');
    if (nameInput) nameInput.required = register;
    document.getElementById('authConfirmPasswordField')?.classList.toggle('hidden', !register);
    const confirmation = document.getElementById('authConfirmPassword');
    if (confirmation) {
        confirmation.required = register;
        if (!register) {
            confirmation.value = '';
            confirmation.setCustomValidity('');
        }
    }
    // If a role was preselected (from role selector), hide the role radios and set the value
    if (preselectedRole) {
        document.getElementById('authRoleField')?.classList.add('hidden');
        const r = document.querySelector(`input[name="authRole"][value="${preselectedRole}"]`);
        if (r)
            r.checked = true;
        // show/hide student-specific fields
        const showStudentFields = preselectedRole === 'student';
        document.getElementById('authCourseField')?.classList.toggle('hidden', !showStudentFields);
        document.getElementById('authCampusField')?.classList.toggle('hidden', !showStudentFields);
    }
    else {
        document.getElementById('authRoleField')?.classList.toggle('hidden', !register);
        // when role radios are visible, toggle student fields based on selected radio
        const current = document.querySelector('input[name="authRole"]:checked')?.value;
        const showStudentFields = register && current === 'student';
        document.getElementById('authCourseField')?.classList.toggle('hidden', !showStudentFields);
        document.getElementById('authCampusField')?.classList.toggle('hidden', !showStudentFields);
    }
    const selectedRole = preselectedRole || document.querySelector('input[name="authRole"]:checked')?.value || localStorage.getItem(ROLE_STORAGE_KEY) || 'student';
    const studentSignup = register && selectedRole === 'student';
    const courseInput = document.getElementById('authCourse');
    const campusInput = document.getElementById('authCampus');
    if (courseInput) courseInput.required = studentSignup;
    if (campusInput) campusInput.required = studentSignup;
    document.getElementById('authSubmitBtn').textContent = register ? 'Criar conta' : 'Entrar';
    // update the inline toggle/link text inside the panel
    const toggleBtn = document.getElementById('authToggleBtn');
    if (toggleBtn) toggleBtn.textContent = register ? 'Já tenho uma conta' : 'Ainda não tenho cadastro';
    // when switching to login ensure student-specific fields are hidden
    if (!register) {
        document.getElementById('authCourseField')?.classList.add('hidden');
        document.getElementById('authCampusField')?.classList.add('hidden');
        document.getElementById('authRoleField')?.classList.add('hidden');
    }
    clearAuthFieldErrors();
    updateConfirmPasswordValidity();
    setAuthMessage('');
}
async function handleAuthSubmit(event) {
    event.preventDefault();
    const register = !document.getElementById('authNameField').classList.contains('hidden');
    const value = (id) => document.getElementById(id).value;
    const email = value('authEmail').trim().toLowerCase();
    const password = value('authPassword');
    clearAuthFieldErrors();
    updateConfirmPasswordValidity();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setAuthEmailError('Informe um e-mail no formato nome@exemplo.com.');
        return;
    }
    if (password.length < 6) {
        setAuthFieldError('password', 'A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    try {
        const body = { email, password };
        if (register) {
            body['name'] = value('authName');
            const roleInput = document.querySelector('input[name="authRole"]:checked');
            const role = roleInput ? roleInput.value : localStorage.getItem(ROLE_STORAGE_KEY);
            if (role)
                body['role'] = role;
            if (body['role'] === 'student') {
                const course = document.getElementById('authCourse')?.value || '';
                const campus = document.getElementById('authCampus')?.value || '';
                body['course'] = course;
                body['campus'] = campus;
            }
        }
        const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 409) {
                setAuthEmailError('Este e-mail já está cadastrado.');
            } else {
                const mappedIssues = (result.issues || []).filter(issue => {
                    const field = issue.path?.[1];
                    return Object.prototype.hasOwnProperty.call(authFieldElements, field) && setAuthFieldError(field, issue.message);
                });
                if (mappedIssues.length === 0) {
                    const firstIssue = result.issues?.[0];
                    setAuthMessage(firstIssue ? `${firstIssue.path.slice(1).join('.')}: ${firstIssue.message}` : result.erro || 'Não foi possível autenticar.');
                }
            }
            return;
        }
        clearAuthFieldErrors();
        setAuthState({ ...result.usuario, course: result.perfil?.course, campus: result.perfil?.campus }, result.token);
        document.getElementById('auth-panel')?.classList.add('hidden');
        if (register) {
            showAuthToast(
                result.emailEnviado
                    ? `Conta criada. E-mail de boas-vindas enviado para ${result.usuario.email}.`
                    : 'Conta criada, mas não foi possível enviar o e-mail de boas-vindas.',
                Boolean(result.emailEnviado)
            );
        }
    }
    catch {
        setAuthMessage('Não foi possível conectar ao servidor.');
    }
}
document.getElementById('authActionBtn')?.addEventListener('click', () => {
    if (!isAuthenticated()) {
        // Open role selector first so user chooses Aluno/Empresa before login/register
        document.getElementById('role-select-panel')?.classList.remove('hidden');
        return;
    }
    void logout();
});
document.getElementById('authCloseBtn')?.addEventListener('click', () => document.getElementById('auth-panel')?.classList.add('hidden'));
document.getElementById('authToastClose')?.addEventListener('click', () => document.getElementById('authToast')?.classList.add('hidden'));
document.getElementById('authToggleBtn')?.addEventListener('click', () => {
    // If currently showing the registration name field, this button should switch to login
    const nameField = document.getElementById('authNameField');
    const showingRegister = nameField && !nameField.classList.contains('hidden');
    if (showingRegister) {
        // switch to login view
        openAuthPanel(false);
        // re-apply previously selected role so UI doesn't default to the other role
        const prev = localStorage.getItem(ROLE_STORAGE_KEY);
        if (prev) applyRoleChoice(prev);
        return;
    }
    // otherwise (login view) open the role selector to start registration
    document.getElementById('role-select-panel')?.classList.remove('hidden');
});
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const password = document.getElementById('authPassword');
    const button = document.getElementById('togglePasswordBtn');
    password.type = password.type === 'password' ? 'text' : 'password';
    button?.setAttribute('aria-label', password.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
});
document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
[
    ['authName', 'name'],
    ['authEmail', 'email'],
    ['authPassword', 'password'],
    ['authCourse', 'course'],
    ['authCampus', 'campus'],
].forEach(([inputId, field]) => {
    document.getElementById(inputId)?.addEventListener('input', () => setAuthFieldError(field, ''));
    document.getElementById(inputId)?.addEventListener('change', () => setAuthFieldError(field, ''));
});
document.getElementById('authPassword')?.addEventListener('input', updateConfirmPasswordValidity);
document.getElementById('authConfirmPassword')?.addEventListener('input', updateConfirmPasswordValidity);
document.querySelectorAll('input[name="authRole"]').forEach(input => {
    input.addEventListener('change', () => {
        const isStudent = input.value === 'student' && input.checked;
        document.getElementById('authCourseField')?.classList.toggle('hidden', !isStudent);
        document.getElementById('authCampusField')?.classList.toggle('hidden', !isStudent);
        const course = document.getElementById('authCourse');
        const campus = document.getElementById('authCampus');
        if (course) course.required = isStudent;
        if (campus) campus.required = isStudent;
    });
});
void loadAuthState().then(() => {
    // Show role selector if user is not authenticated
    if (!isAuthenticated() && document.getElementById('auth-panel')?.classList.contains('hidden')) {
        showRoleSelectorIfNeeded();
    }
});

interface AuthUser { id: number; name: string; email: string; role: string; course?: string; campus?: string; }
interface AuthWindow extends Window {
    authenticatedUser?: AuthUser | null;
    updateProfileFormVisibility?: (role: string | null) => void;
}

let authenticatedUser: AuthUser | null = null;
const ROLE_STORAGE_KEY = 'impulsiona_role_choice';
let authToastTimer: number | undefined;

function isAuthenticated(): boolean { return Boolean(localStorage.getItem('impulsiona_token')); }
function clearAuthSession(message?: string) {
    localStorage.removeItem('impulsiona_token');
    localStorage.removeItem('impulsiona_user');
    setAuthState(null);
    if (message) {
        openAuthPanel(false);
        setAuthMessage(message);
    }
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
    } catch {
        alert('Não foi possível conectar ao servidor para encerrar a sessão.');
    }
}
async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('impulsiona_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
        clearAuthSession(token ? 'Sua sessão expirou. Entre novamente.' : 'Entre para continuar.');
    }
    return response;
}
function setAuthState(user: AuthUser | null, token?: string) {
    authenticatedUser = user;
    (window as AuthWindow).authenticatedUser = user;
    if (token) localStorage.setItem('impulsiona_token', token);
    if (user) localStorage.setItem('impulsiona_user', JSON.stringify(user));
    else localStorage.removeItem('impulsiona_user');
    const label = document.getElementById('authUserLabel');
    const action = document.getElementById('authActionBtn');
    if (label) label.textContent = user ? `Olá, ${user.name}` : 'Visitante';
    if (action) action.textContent = user ? 'Sair' : 'Entrar';
    const toggle = document.getElementById('authToggleBtn');
    if (toggle) toggle.style.display = user ? 'none' : 'inline-block';
    const profileName = document.getElementById('profileDisplayName');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileName) profileName.textContent = user?.name || 'Visitante';
    if (profileAvatar) profileAvatar.textContent = user?.name?.charAt(0).toUpperCase() || '?';
    const roleLine = document.getElementById('profileRoleLine');
    const campusLine = document.getElementById('profileCampusLine');
    const guestRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (roleLine) roleLine.textContent = user ? (user.role === 'company' ? 'Empresa' : 'Aluno') : guestRole ? `${guestRole === 'company' ? 'Empresa' : 'Aluno'} (visitante)` : '';
    if (campusLine) campusLine.textContent = user?.campus ? `IFPB - Campus ${user.campus}` : '';
    document.querySelectorAll<HTMLElement>('[data-auth-required]').forEach(element => {
        element.classList.toggle('auth-disabled', !user);
    });
    document.querySelectorAll<HTMLElement>('.company-only').forEach(element => {
        element.classList.toggle('hidden', user?.role !== 'company');
    });
    document.querySelectorAll<HTMLElement>('.student-only').forEach(element => {
        element.classList.toggle('hidden', user?.role !== 'student');
    });
    if (user?.role) localStorage.setItem(ROLE_STORAGE_KEY, user.role);
    const badge = document.getElementById('authRoleBadge');
    if (badge) {
        const role = user?.role || guestRole;
        badge.textContent = role ? `${role === 'company' ? 'Empresa' : 'Aluno'}${user ? '' : ' (visitante)'}` : '';
        badge.classList.toggle('hidden', !role);
    }
    (window as AuthWindow).updateProfileFormVisibility?.(user?.role || guestRole);
}
function setAuthMessage(message: string, error = true) {
    const target = document.getElementById('authMessage');
    if (target) { target.textContent = message; target.style.color = error ? '#b00020' : '#1f8a3d'; }
}
function showAuthToast(message: string, success: boolean) {
    const toast = document.getElementById('authToast');
    const text = document.getElementById('authToastMessage');
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.toggle('auth-toast--warning', !success);
    toast.classList.remove('hidden');
    window.clearTimeout(authToastTimer);
    authToastTimer = window.setTimeout(() => toast.classList.add('hidden'), 6000);
}
type AuthField = 'name' | 'email' | 'password' | 'course' | 'campus';
const authFieldElements: Record<AuthField, [string, string]> = {
    name: ['authName', 'authNameError'],
    email: ['authEmail', 'authEmailError'],
    password: ['authPassword', 'authPasswordError'],
    course: ['authCourse', 'authCourseError'],
    campus: ['authCampus', 'authCampusError'],
};
function setAuthFieldError(field: AuthField, message: string): boolean {
    const [inputId, errorId] = authFieldElements[field];
    const input = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
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
    (Object.keys(authFieldElements) as AuthField[]).forEach(field => setAuthFieldError(field, ''));
}
function setAuthEmailError(message: string) {
    setAuthFieldError('email', message);
}
function updateConfirmPasswordValidity() {
    const password = document.getElementById('authPassword') as HTMLInputElement | null;
    const confirmation = document.getElementById('authConfirmPassword') as HTMLInputElement | null;
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
    if (!isAuthenticated()) return;
    try {
        const response = await authFetch('/api/auth/me');
        if (!response.ok) return;
        const result = await response.json();
        if (result.usuario) setAuthState({ ...result.usuario, course: result.perfil?.course, campus: result.perfil?.campus });
        else clearAuthSession('Entre novamente para continuar.');
    } catch (error) {
        console.error('Não foi possível validar a sessão:', error);
    }
}
function applyRoleChoice(role: string) {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    document.querySelectorAll<HTMLElement>('.company-only').forEach(element => element.classList.toggle('hidden', role !== 'company'));
    document.querySelectorAll<HTMLElement>('.student-only').forEach(element => element.classList.toggle('hidden', role !== 'student'));
    const badge = document.getElementById('authRoleBadge');
    if (badge && !isAuthenticated()) {
        badge.textContent = `${role === 'company' ? 'Empresa' : 'Aluno'} (visitante)`;
        badge.classList.remove('hidden');
    }
}
function openAuthPanel(register = false, preselectedRole: string | null = null) {
    document.getElementById('auth-panel')?.classList.remove('hidden');
    document.getElementById('authTitle')!.textContent = register ? 'Criar conta' : 'Entrar';
    document.getElementById('authNameField')?.classList.toggle('hidden', !register);
    const nameInput = document.getElementById('authName') as HTMLInputElement | null;
    if (nameInput) nameInput.required = register;
    document.getElementById('authConfirmPasswordField')?.classList.toggle('hidden', !register);
    const confirmation = document.getElementById('authConfirmPassword') as HTMLInputElement | null;
    if (confirmation) {
        confirmation.required = register;
        if (!register) {
            confirmation.value = '';
            confirmation.setCustomValidity('');
        }
    }
    document.getElementById('authRoleField')?.classList.toggle('hidden', !register || Boolean(preselectedRole));
    const role = preselectedRole || document.querySelector<HTMLInputElement>('input[name="authRole"]:checked')?.value || localStorage.getItem(ROLE_STORAGE_KEY) || 'student';
    const roleInput = document.querySelector<HTMLInputElement>(`input[name="authRole"][value="${role}"]`);
    if (roleInput) roleInput.checked = true;
    document.getElementById('authCourseField')?.classList.toggle('hidden', !register || role !== 'student');
    document.getElementById('authCampusField')?.classList.toggle('hidden', !register || role !== 'student');
    const studentSignup = register && role === 'student';
    const courseInput = document.getElementById('authCourse') as HTMLSelectElement | null;
    const campusInput = document.getElementById('authCampus') as HTMLSelectElement | null;
    if (courseInput) courseInput.required = studentSignup;
    if (campusInput) campusInput.required = studentSignup;
    document.getElementById('authSubmitBtn')!.textContent = register ? 'Criar conta' : 'Entrar';
    const toggle = document.getElementById('authToggleBtn');
    if (toggle) toggle.textContent = register ? 'Já tenho uma conta' : 'Ainda não tenho cadastro';
    clearAuthFieldErrors();
    updateConfirmPasswordValidity();
    setAuthMessage('');
}
async function handleAuthSubmit(event: Event) {
    event.preventDefault();
    const register = !document.getElementById('authNameField')!.classList.contains('hidden');
    const value = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
    const email = value('authEmail').trim().toLowerCase();
    const password = value('authPassword');
    clearAuthFieldErrors();
    updateConfirmPasswordValidity();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthEmailError('Informe um e-mail no formato nome@exemplo.com.'); return; }
    if (password.length < 6) { setAuthFieldError('password', 'A senha deve ter no mínimo 6 caracteres.'); return; }
    try {
        const body: Record<string, string> = { email, password };
        if (register) {
            body.name = value('authName');
            body.role = document.querySelector<HTMLInputElement>('input[name="authRole"]:checked')?.value || localStorage.getItem(ROLE_STORAGE_KEY) || 'student';
            if (body.role === 'student') {
                body.course = (document.getElementById('authCourse') as HTMLSelectElement | null)?.value || '';
                body.campus = (document.getElementById('authCampus') as HTMLSelectElement | null)?.value || '';
            }
        }
        const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 409) setAuthEmailError('Este e-mail já está cadastrado.');
            else {
                const mappedIssues = (result.issues || []).filter((issue: { path?: unknown[]; message: string }) => {
                    const field = issue.path?.[1];
                    return ['name', 'email', 'password', 'course', 'campus'].includes(String(field)) &&
                        setAuthFieldError(field as AuthField, issue.message);
                });
                if (mappedIssues.length === 0) {
                    const firstIssue = result.issues?.[0];
                    setAuthMessage(firstIssue ? `${firstIssue.path.slice(1).join('.')}: ${firstIssue.message}` : result.erro || 'Não foi possível autenticar.');
                }
            }
            return;
        }
        clearAuthFieldErrors();
        setAuthState({ ...result.usuario, course: result.perfil?.course, campus: result.perfil?.campus }, result.token); document.getElementById('auth-panel')?.classList.add('hidden');
        document.getElementById('role-select-panel')?.classList.add('hidden');
        if (register) {
            showAuthToast(
                result.emailEnviado
                    ? `Conta criada. E-mail de boas-vindas enviado para ${result.usuario.email}.`
                    : 'Conta criada, mas não foi possível enviar o e-mail de boas-vindas.',
                Boolean(result.emailEnviado)
            );
        }
    } catch { setAuthMessage('Não foi possível conectar ao servidor.'); }
}
document.getElementById('authActionBtn')?.addEventListener('click', () => {
    if (!isAuthenticated()) { openAuthPanel(); return; }
    void logout();
});
document.getElementById('choose-student')?.addEventListener('click', () => {
    applyRoleChoice('student');
    document.getElementById('role-select-panel')?.classList.add('hidden');
    openAuthPanel(true, 'student');
});
document.getElementById('choose-company')?.addEventListener('click', () => {
    applyRoleChoice('company');
    document.getElementById('role-select-panel')?.classList.add('hidden');
    openAuthPanel(true, 'company');
});
document.getElementById('role-close')?.addEventListener('click', () => document.getElementById('role-select-panel')?.classList.add('hidden'));
document.getElementById('authCloseBtn')?.addEventListener('click', () => document.getElementById('auth-panel')?.classList.add('hidden'));
document.getElementById('authToastClose')?.addEventListener('click', () => document.getElementById('authToast')?.classList.add('hidden'));
document.getElementById('authToggleBtn')?.addEventListener('click', () => {
    const showingRegister = !document.getElementById('authNameField')?.classList.contains('hidden');
    if (showingRegister) {
        openAuthPanel(false);
        const role = localStorage.getItem(ROLE_STORAGE_KEY);
        if (role) applyRoleChoice(role);
    } else {
        document.getElementById('auth-panel')?.classList.add('hidden');
        document.getElementById('role-select-panel')?.classList.remove('hidden');
    }
});
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const password = document.getElementById('authPassword') as HTMLInputElement;
    const button = document.getElementById('togglePasswordBtn');
    password.type = password.type === 'password' ? 'text' : 'password';
    button?.setAttribute('aria-label', password.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
});
document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
([
    ['authName', 'name'],
    ['authEmail', 'email'],
    ['authPassword', 'password'],
    ['authCourse', 'course'],
    ['authCampus', 'campus'],
] as Array<[string, AuthField]>).forEach(([inputId, field]) => {
    document.getElementById(inputId)?.addEventListener('input', () => setAuthFieldError(field, ''));
    document.getElementById(inputId)?.addEventListener('change', () => setAuthFieldError(field, ''));
});
document.getElementById('authPassword')?.addEventListener('input', updateConfirmPasswordValidity);
document.getElementById('authConfirmPassword')?.addEventListener('input', updateConfirmPasswordValidity);
document.querySelectorAll<HTMLInputElement>('input[name="authRole"]').forEach(input => {
    input.addEventListener('change', () => {
        const isStudent = input.value === 'student' && input.checked;
        document.getElementById('authCourseField')?.classList.toggle('hidden', !isStudent);
        document.getElementById('authCampusField')?.classList.toggle('hidden', !isStudent);
        const course = document.getElementById('authCourse') as HTMLSelectElement | null;
        const campus = document.getElementById('authCampus') as HTMLSelectElement | null;
        if (course) course.required = isStudent;
        if (campus) campus.required = isStudent;
    });
});
void loadAuthState().then(() => {
    if (!isAuthenticated() && document.getElementById('auth-panel')?.classList.contains('hidden')) {
        document.getElementById('role-select-panel')?.classList.remove('hidden');
    }
});
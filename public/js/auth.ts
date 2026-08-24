interface AuthUser { id: number; name: string; email: string; role: string; }
let authenticatedUser: AuthUser | null = null;

function isAuthenticated(): boolean { return Boolean(localStorage.getItem('impulsiona_token')); }
function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('impulsiona_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
}
function setAuthState(user: AuthUser | null, token?: string) {
    authenticatedUser = user;
    if (token) localStorage.setItem('impulsiona_token', token);
    const label = document.getElementById('authUserLabel');
    const action = document.getElementById('authActionBtn');
    if (label) label.textContent = user ? `Olá, ${user.name}` : 'Visitante';
    if (action) action.textContent = user ? 'Sair' : 'Entrar';
}
function setAuthMessage(message: string, error = true) {
    const target = document.getElementById('authMessage');
    if (target) { target.textContent = message; target.style.color = error ? '#b00020' : '#1f8a3d'; }
}
async function loadAuthState() {
    if (!isAuthenticated()) return;
    const response = await authFetch('/api/auth/me');
    if (!response.ok) { localStorage.removeItem('impulsiona_token'); return; }
    const result = await response.json(); setAuthState(result.usuario);
}
function openAuthPanel(register = false) {
    document.getElementById('auth-panel')?.classList.remove('hidden');
    document.getElementById('authTitle')!.textContent = register ? 'Criar conta' : 'Entrar';
    document.getElementById('authNameField')?.classList.toggle('hidden', !register);
    document.getElementById('authSubmitBtn')!.textContent = register ? 'Criar conta' : 'Entrar';
    setAuthMessage('');
}
async function handleAuthSubmit(event: Event) {
    event.preventDefault();
    const register = !document.getElementById('authNameField')!.classList.contains('hidden');
    const value = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
    const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value('authName'), email: value('authEmail'), password: value('authPassword') }) });
    const result = await response.json();
    if (!response.ok) { setAuthMessage(result.erro || 'Não foi possível autenticar.'); return; }
    setAuthState(result.usuario, result.token); document.getElementById('auth-panel')?.classList.add('hidden');
}
document.getElementById('authActionBtn')?.addEventListener('click', () => {
    if (!isAuthenticated()) { openAuthPanel(); return; }
    localStorage.removeItem('impulsiona_token'); setAuthState(null); switchView('jobs');
});
document.getElementById('authCloseBtn')?.addEventListener('click', () => document.getElementById('auth-panel')?.classList.add('hidden'));
document.getElementById('authToggleBtn')?.addEventListener('click', () => openAuthPanel(document.getElementById('authTitle')?.textContent === 'Entrar'));
document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
void loadAuthState();
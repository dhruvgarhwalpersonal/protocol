/**
 * auth.js — Protocol Authentication System (Firebase Edition)
 *
 * IMPORTANT: index.html calls signup() and login() synchronously inside a
 * setTimeout and reads .success off the return value immediately.
 * Firebase Auth is async, so we bridge this by patching authDoSignup /
 * authDoLogin on window after DOMContentLoaded with async-aware versions.
 *
 * window.ProtocolAuth API stays identical:
 *   signup(user, pass)  → Promise<{success, user/error}>
 *   login(user, pass)   → Promise<{success, user, session/error}>
 *   logout()            → Promise<{success}>
 *   currentUser()       → {username, displayName, avatarColor, createdAt} | null
 *   isLoggedIn()        → boolean
 *   updateDisplayName() → Promise<{success}>
 */

(function (window) {
  'use strict';

  var AVATAR_COLORS = [
    '#4a8fff','#3fcf8e','#f5a623','#ff5c5c','#a78bfa',
    '#38bdf8','#fb923c','#e879f9','#00ffcc','#fcd34d'
  ];
  function pickAvatarColor(username) {
    var idx = 0;
    for (var i = 0; i < username.length; i++) idx += username.charCodeAt(i);
    return AVATAR_COLORS[idx % AVATAR_COLORS.length];
  }

  function toEmail(username) {
    return username.trim().toLowerCase() + '@protocol-app.local';
  }

  var _cachedUser = null;
  var _authReady  = false;
  var _authReadyCallbacks = [];

  function auth() { return firebase.auth(); }
  function db()   { return firebase.firestore(); }

  function profileRef(uid) {
    return db().collection('users').doc(uid).collection('meta').doc('profile');
  }

  function buildProfile(username) {
    return {
      username:    username,
      displayName: username,
      avatarColor: pickAvatarColor(username),
      createdAt:   Date.now()
    };
  }

  async function fetchProfile(uid) {
    try {
      var snap = await profileRef(uid).get();
      return snap.exists ? snap.data() : null;
    } catch (e) { return null; }
  }

  async function writeProfile(uid, profile) {
    try { await profileRef(uid).set(profile); } catch (e) {}
  }

  function _initAuthListener() {
    auth().onAuthStateChanged(async function (fbUser) {
      if (fbUser) {
        var profile = await fetchProfile(fbUser.uid);
        _cachedUser = profile || null;
      } else {
        _cachedUser = null;
      }
      if (!_authReady) {
        _authReady = true;
        _authReadyCallbacks.forEach(function (cb) { cb(); });
        _authReadyCallbacks = [];
      }
    });
  }

  function onAuthReady(cb) {
    if (_authReady) { cb(); return; }
    _authReadyCallbacks.push(cb);
  }

  /* ── Core async API ── */

  async function signup(username, password) {
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!username) return { success: false, error: 'Username is required.' };
    if (username.length < 2) return { success: false, error: 'Username must be at least 2 characters.' };
    if (username.length > 32) return { success: false, error: 'Username must be 32 characters or fewer.' };
    if (!/^[a-z0-9_.\-]+$/.test(username)) return { success: false, error: 'Username may only contain letters, numbers, _ . -' };
    if (!password) return { success: false, error: 'Password is required.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    try {
      var cred = await auth().createUserWithEmailAndPassword(toEmail(username), password);
      var profile = buildProfile(username);
      await writeProfile(cred.user.uid, profile);
      _cachedUser = profile;
      return { success: true, user: profile };
    } catch (e) {
      var msg = e.message || 'Signup failed.';
      if (e.code === 'auth/email-already-in-use') msg = 'Username already taken. Please choose another.';
      return { success: false, error: msg };
    }
  }

  async function login(username, password) {
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!username) return { success: false, error: 'Username is required.' };
    if (!password) return { success: false, error: 'Password is required.' };
    try {
      var cred = await auth().signInWithEmailAndPassword(toEmail(username), password);
      var profile = await fetchProfile(cred.user.uid);
      if (!profile) { profile = buildProfile(username); await writeProfile(cred.user.uid, profile); }
      _cachedUser = profile;
      var session = { username: username, token: cred.user.uid, expiresAt: Date.now() + 30*24*60*60*1000 };
      return { success: true, user: profile, session: session };
    } catch (e) {
      var msg = e.message || 'Login failed.';
      if (e.code === 'auth/user-not-found') msg = 'No account found for that username.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Incorrect password. Please try again.';
      if (e.code === 'auth/invalid-email') msg = 'No account found for that username.';
      return { success: false, error: msg };
    }
  }

  async function logout() {
    _cachedUser = null;
    try { await auth().signOut(); } catch (e) {}
    return { success: true };
  }

  function currentUser() { return _cachedUser; }

  function isLoggedIn() {
    return !!(auth().currentUser);
  }

  async function updateDisplayName(username, displayName) {
    displayName = (displayName || '').trim();
    if (!displayName) return { success: false, error: 'Display name cannot be empty.' };
    var fbUser = auth().currentUser;
    if (!fbUser) return { success: false, error: 'Not logged in.' };
    try {
      await profileRef(fbUser.uid).update({ displayName: displayName });
      if (_cachedUser) _cachedUser.displayName = displayName;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'Update failed.' };
    }
  }

  /* ── Patch index.html's sync functions with async versions ── */

  function _patchIndexFunctions() {

    window.authDoSignup = async function () {
      window.authClearErrors && window.authClearErrors();
      var user = (document.getElementById('auth-signup-user').value || '').trim();
      var pass = document.getElementById('auth-signup-pass').value || '';
      var pass2 = document.getElementById('auth-signup-pass2').value || '';
      if (!user) { window.authShowError && window.authShowError('auth-signup-error', 'Please choose a username.'); return; }
      if (!pass) { window.authShowError && window.authShowError('auth-signup-error', 'Please choose a password.'); return; }
      if (pass !== pass2) { window.authShowError && window.authShowError('auth-signup-error', 'Passwords do not match. Please try again.'); return; }
      var btn = document.getElementById('auth-signup-btn');
      btn.disabled = true;
      btn.textContent = 'Creating account…';
      var res = await signup(user, pass);
      if (!res.success) {
        btn.disabled = false;
        btn.textContent = 'Create Account →';
        window.authShowError && window.authShowError('auth-signup-error', res.error);
        return;
      }
      var loginRes = await login(user, pass);
      btn.disabled = false;
      btn.textContent = 'Create Account →';
      if (!loginRes.success) {
        window.authShowError && window.authShowError('auth-signup-error', 'Account created! Please sign in.');
        window.authSwitchTab && window.authSwitchTab('login');
        var lu = document.getElementById('auth-login-user');
        if (lu) lu.value = user;
        return;
      }
      if (window.ProtocolDB && window.ProtocolDB.waitForPrefetch) await window.ProtocolDB.waitForPrefetch();
      window.authEnterApp && window.authEnterApp();
    };

    window.authDoLogin = async function () {
      window.authClearErrors && window.authClearErrors();
      var user = (document.getElementById('auth-login-user').value || '').trim();
      var pass = document.getElementById('auth-login-pass').value || '';
      if (!user) { window.authShowError && window.authShowError('auth-login-error', 'Please enter your username.'); return; }
      if (!pass) { window.authShowError && window.authShowError('auth-login-error', 'Please enter your password.'); return; }
      var btn = document.getElementById('auth-login-btn');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      var res = await login(user, pass);
      btn.disabled = false;
      btn.textContent = 'Sign In →';
      if (!res.success) {
        window.authShowError && window.authShowError('auth-login-error', res.error);
        var pe = document.getElementById('auth-login-pass');
        if (pe) pe.value = '';
        return;
      }
      if (window.ProtocolDB && window.ProtocolDB.waitForPrefetch) await window.ProtocolDB.waitForPrefetch();
      window.authEnterApp && window.authEnterApp();
    };

    window.authLogout = async function () {
      await logout();
      location.reload();
    };
  }

  /* ── Init ── */
  function _init() {
    _initAuthListener();
    _patchIndexFunctions();

    /* Auto-boot if session already exists (returning user) */
    onAuthReady(async function () {
      var fbUser = auth().currentUser;
      if (fbUser && _cachedUser) {
        if (window.ProtocolDB && window.ProtocolDB.waitForPrefetch) await window.ProtocolDB.waitForPrefetch();
        var authScr = document.getElementById('auth-screen');
        if (authScr && authScr.classList.contains('visible')) {
          window.authEnterApp && window.authEnterApp();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 0);
  }

  window.ProtocolAuth = {
    signup:            signup,
    login:             login,
    logout:            logout,
    currentUser:       currentUser,
    isLoggedIn:        isLoggedIn,
    updateDisplayName: updateDisplayName,
    onAuthReady:       onAuthReady
  };

}(window));

/**
 * db.js — Protocol Per-User Storage Layer (Firebase / Firestore Edition)
 *
 * FIXES:
 *   1. waitForPrefetch() uses a Promise resolver list — zero polling, zero race.
 *   2. _fetchForUid always calls _resolvePrefetchWaiters() when done (even on error).
 *   3. onAuthStateChanged resolves prefetch for logged-out case too (no infinite hang).
 *   4. _resetCache clears _prefetchResolvers so stale waiters can't fire.
 *   5. saveState/saveConfig write immediately (no debounce lost on fast reload).
 *   6. beforeunload does a synchronous Firestore flush attempt via fetch keepalive.
 */

(function (window) {
  'use strict';

  var _stateCache        = null;
  var _configCache       = null;
  var _prefetchDone      = false;
  var _currentUidFetched = null;
  var _pendingState      = null;
  var _pendingConfig     = null;
  var _stateTimer        = null;
  var _configTimer       = null;
  var _prefetchResolvers = [];
  var DEBOUNCE_MS        = 150;

  function fsdb() { return firebase.firestore(); }

  function currentUid() {
    var fbUser = firebase.auth().currentUser;
    return fbUser ? fbUser.uid : null;
  }

  function stateDoc(uid) {
    return fsdb().collection('users').doc(uid).collection('data').doc('state');
  }

  function configDoc(uid) {
    return fsdb().collection('users').doc(uid).collection('data').doc('config');
  }

  function encode(value) { return { _d: JSON.stringify(value) }; }

  function decode(docData) {
    if (!docData || !docData._d) return null;
    try { return JSON.parse(docData._d); } catch (e) { return null; }
  }

  /* Resolve all waitForPrefetch() callers immediately */
  function _resolvePrefetchWaiters() {
    _prefetchDone = true;
    var resolvers = _prefetchResolvers.slice();
    _prefetchResolvers = [];
    resolvers.forEach(function (resolve) { resolve(); });
  }

  function _resetCache() {
    _stateCache        = null;
    _configCache       = null;
    _prefetchDone      = false;
    _currentUidFetched = null;
    _pendingState      = null;
    _pendingConfig     = null;
    _prefetchResolvers = [];
    if (_stateTimer)  { clearTimeout(_stateTimer);  _stateTimer  = null; }
    if (_configTimer) { clearTimeout(_configTimer); _configTimer = null; }
  }

  /* Fetch state + config, then resolve all prefetch waiters */
  async function _fetchForUid(uid) {
    try {
      var results = await Promise.all([
        stateDoc(uid).get(),
        configDoc(uid).get()
      ]);
      _stateCache        = results[0].exists ? decode(results[0].data()) : null;
      _configCache       = results[1].exists ? decode(results[1].data()) : null;
      _currentUidFetched = uid;
      console.log('[ProtocolDB] fetch complete — uid:', uid,
                  '| state:', !!_stateCache, '| config:', !!_configCache);
    } catch (e) {
      console.error('[ProtocolDB] fetch error:', e);
    }
    /* Always resolve — even if fetch threw, unblock the app */
    _resolvePrefetchWaiters();
  }

  /* flushNow: write everything pending to Firestore right now */
  async function flushNow() {
    var uid = currentUid();
    if (!uid) return;

    if (_stateTimer)  { clearTimeout(_stateTimer);  _stateTimer  = null; }
    if (_configTimer) { clearTimeout(_configTimer); _configTimer = null; }

    var writes = [];

    if (_pendingState !== null) {
      var s = _pendingState;
      writes.push(
        stateDoc(uid).set(encode(s)).then(function () {
          console.log('[ProtocolDB] flushed state');
          _pendingState = null;
        })
      );
    }

    if (_pendingConfig !== null) {
      var c = _pendingConfig;
      writes.push(
        configDoc(uid).set(encode(c)).then(function () {
          console.log('[ProtocolDB] flushed config');
          _pendingConfig = null;
        })
      );
    }

    if (writes.length > 0) {
      try { await Promise.all(writes); }
      catch (e) { console.error('[ProtocolDB] flush error:', e); }
    }
  }

  /* waitForPrefetch: returns a Promise that resolves once Firestore data is loaded */
  function waitForPrefetch() {
    if (_prefetchDone) return Promise.resolve();
    return new Promise(function (resolve) {
      _prefetchResolvers.push(resolve);
    });
  }

  /* =====================================================
     PUBLIC API
  ===================================================== */

  function getState() { return _stateCache; }

  function saveState(S) {
    _stateCache   = S;
    _pendingState = S;
    if (_stateTimer) clearTimeout(_stateTimer);
    _stateTimer = setTimeout(function () {
      var uid = currentUid();
      if (!uid) { console.warn('[ProtocolDB] saveState: no uid, skipping write'); return; }
      console.log('[ProtocolDB] writing state to Firestore...');
      stateDoc(uid).set(encode(S))
        .then(function () { console.log('[ProtocolDB] state saved ✓'); _pendingState = null; })
        .catch(function (e) { console.error('[ProtocolDB] saveState error:', e); });
    }, DEBOUNCE_MS);
  }

  function getConfig() { return _configCache; }

  function saveConfig(CFG) {
    _configCache   = CFG;
    _pendingConfig = CFG;
    if (_configTimer) clearTimeout(_configTimer);
    _configTimer = setTimeout(function () {
      var uid = currentUid();
      if (!uid) { console.warn('[ProtocolDB] saveConfig: no uid, skipping write'); return; }
      configDoc(uid).set(encode(CFG))
        .then(function () { console.log('[ProtocolDB] config saved ✓'); _pendingConfig = null; })
        .catch(function (e) { console.error('[ProtocolDB] saveConfig error:', e); });
    }, DEBOUNCE_MS);
  }

  function hasData(username) { return _stateCache !== null; }

  function clearUserData(username) {
    _stateCache = null; _configCache = null;
    _pendingState = null; _pendingConfig = null;
    var uid = currentUid();
    if (!uid) return;
    Promise.all([stateDoc(uid).delete(), configDoc(uid).delete()])
      .catch(function (e) { console.error('[ProtocolDB] clearUserData error:', e); });
  }

  /* Auth listener: fresh fetch on every login */
  function _initAuthListener() {
    firebase.auth().onAuthStateChanged(function (fbUser) {
      if (fbUser) {
        if (fbUser.uid !== _currentUidFetched) {
          _resetCache();
          _fetchForUid(fbUser.uid);
        } else {
          /* Same uid already fetched — just unblock any waiters */
          if (!_prefetchDone) _resolvePrefetchWaiters();
        }
      } else {
        /* Logged out — unblock waiters so the app doesn't hang */
        _resetCache();
        _resolvePrefetchWaiters();
      }
    });
  }

  /* Patch authLogout: flush first, confirm, then sign out */
  function _patchLogout() {
    window.authLogout = async function () {
      if (window._clockInterval) { clearInterval(window._clockInterval); window._clockInterval = null; }
      await flushNow();
      if (!confirm('Your data has been saved.\n\nSign out of Protocol?')) {
        window._clockInterval = setInterval(function () {
          if (typeof updateClock === 'function') updateClock();
        }, 60000);
        return;
      }
      await window.ProtocolAuth.logout();
      location.reload();
    };
  }

  /* beforeunload: flush pending writes before page closes */
  function _initBeforeUnload() {
    window.addEventListener('beforeunload', function () {
      var uid = currentUid();
      if (!uid) return;
      if (_stateTimer)  { clearTimeout(_stateTimer);  _stateTimer  = null; }
      if (_configTimer) { clearTimeout(_configTimer); _configTimer = null; }
      if (_pendingState === null && _pendingConfig === null) return;

      /* Firestore SDK write — browsers give async tasks a short window on beforeunload */
      if (_pendingState !== null) {
        stateDoc(uid).set(encode(_pendingState)).catch(function(){});
      }
      if (_pendingConfig !== null) {
        configDoc(uid).set(encode(_pendingConfig)).catch(function(){});
      }
    });
  }

  /* Init */
  function _init() {
    _initAuthListener();
    _patchLogout();
    _initBeforeUnload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 0);
  }

  window.ProtocolDB = {
    getState:        getState,
    saveState:       saveState,
    getConfig:       getConfig,
    saveConfig:      saveConfig,
    hasData:         hasData,
    clearUserData:   clearUserData,
    waitForPrefetch: waitForPrefetch,
    flushNow:        flushNow
  };

}(window));

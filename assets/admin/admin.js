/* Admin-only view. Hiding controls is UX, never authorization. Every moderation
 * RPC checks a live Auth session and the private server-side UID allowlist. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const labels = {pending:'待审核',approved:'已通过',rejected:'已拒绝',all:'全部'};
 const config = window.KRIS_ADMIN_CONFIG;
 const games = new Map((window.KRIS_ADMIN_GAMES || []).map(game => [game.id, game]));
 const pageSize = 25;
 let client, userId = null, authorized = false, offset = 0, total = 0, selectedStatus = 'pending';
 let epoch = 0, requestId = 0, loading = false, mutating = false, authBusy = false, disposed = false, logoutBusy = false, locked = false, activeConfirm = null, sendTimer = null;
 function notice(message, error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); }
 function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; if (className === 'review-body') el.setAttribute('data-i18n-skip',''); return el; }
 function clearPrivateView() {
  authorized = false; userId = null; epoch++; requestId++; total = 0; activeConfirm = null;
  $('review-list').replaceChildren(); $('workspace').hidden = true; $('account').hidden = true;
  $('account-label').textContent = ''; $('denied').hidden = true; $('empty').hidden = true;
  $('list-summary').textContent = ''; loading = false; mutating = false;
 }
 function lockControls() {
  const busy = loading || mutating;
  $('refresh').disabled = busy; $('game-filter').disabled = busy;
  document.querySelectorAll('[data-status]').forEach(button => { button.disabled = busy; });
  $('previous').disabled = busy || offset === 0;
  $('next').disabled = busy || offset + pageSize >= total;
  $('review-list').setAttribute('aria-busy', String(busy));
  document.querySelectorAll('.review-actions button,.confirm-action button').forEach(button => { button.disabled = mutating; });
 }
 function errorText(error, action) {
  if (error?.code === '40001') return '这条评价刚刚被改过。列表已刷新，请重新确认后再操作。';
  if (error?.code === '54000') return '待审核队列已满。请先处理一些待审核评价，再将这条评价重新设为待审。';
  if (error?.code === 'P0002') return '这条评价已不存在，请刷新列表。';
  if (['PGRST202','PGRST205'].includes(error?.code)) return '管理功能正在配置中，请稍后重试。';
  if (error?.status === 429 || error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit') return '操作太频繁，请稍后再试。';
  if (action === 'signin') return '登录邮件未能发送。请确认这是已获授权的邮箱，稍后再试；若仍失败，请联系站点管理员检查账号和邮件设置。';
  return action === 'save' ? '未能确认操作结果。请先刷新列表核对状态，再决定是否重试。' : '暂时无法加载评价，请检查网络后点击“刷新列表”。';
 }
 function isDenied(error) { return ['42501','PGRST301','PGRST302','PGRST303'].includes(error?.code) || error?.status === 401 || error?.status === 403; }
 async function expire(message) {
  if (logoutBusy) return;
  logoutBusy = true; locked = true; client.auth.stopAutoRefresh();
  clearPrivateView(); $('login').hidden = false; notice(message, true);
  // Local state is cleared first, even if the sign-out request cannot complete.
  try { await client.auth.signOut({scope:'local'}); } catch (_) { /* Already locked. */ }
  finally { try { window.sessionStorage.removeItem('kris-review-admin-session'); } catch (_) {} logoutBusy = false; notice(message, true); }
 }
 async function listReviews({keepNotice = false} = {}) {
  if (!authorized || disposed || mutating) return;
  const currentEpoch = epoch, currentRequest = ++requestId;
  loading = true; activeConfirm = null; $('review-list').replaceChildren(); $('empty').hidden = true; lockControls();
  if (!keepNotice) notice('正在加载评价…');
  try {
   const {data, error} = await client.rpc('review_admin_list', {p_status:selectedStatus === 'all' ? null : selectedStatus,p_game_id:$('game-filter').value || null,p_limit:pageSize,p_offset:offset});
   if (disposed || epoch !== currentEpoch || requestId !== currentRequest) return;
   if (error) throw error;
   if (!data || !Array.isArray(data.items) || !Number.isSafeInteger(data.total) || data.total < 0) throw new Error('Invalid response');
   total = data.total;
   if (offset >= total && offset > 0) { offset = Math.max(0, Math.floor((total - 1) / pageSize) * pageSize); loading = false; return listReviews({keepNotice}); }
   for (const review of data.items) renderReview(review);
   document.querySelectorAll('[data-count]').forEach(count => { const value = data.counts?.[count.dataset.count]; count.textContent = Number.isSafeInteger(value) && value >= 0 ? String(value) : '—'; });
   $('list-title').textContent = `${labels[selectedStatus]}评价`;
   $('list-summary').textContent = total ? `共 ${total} 条 · 当前 ${offset + 1}–${Math.min(offset + pageSize,total)} 条` : '共 0 条';
   $('page-label').textContent = `第 ${Math.floor(offset / pageSize) + 1} / ${Math.max(1,Math.ceil(total / pageSize))} 页`;
   $('empty').hidden = data.items.length > 0;
   $('empty-title').textContent = selectedStatus === 'pending' ? '还没有待审核的评价' : '这里暂时没有评价';
   $('empty-copy').textContent = $('game-filter').value ? '可以切换到“所有游戏”，查看其他游戏的评价。' : selectedStatus === 'pending' ? '新的游戏评价会先来到这里，等待你审核。' : '换个筛选条件看看吧。';
   if (!keepNotice) notice('');
  } catch (error) {
   if (disposed || epoch !== currentEpoch || requestId !== currentRequest) return;
   if (isDenied(error)) return expire('登录已失效或没有管理权限，请重新登录。');
   notice(errorText(error,'load'), true); total = 0; $('list-summary').textContent = '加载失败';
  } finally {
   if (epoch === currentEpoch && requestId === currentRequest) { loading = false; lockControls(); }
  }
 }
 function renderReview(review) {
  if (!review || typeof review.id !== 'string' || typeof review.body !== 'string' || !labels[review.status] || review.status === 'all') throw new Error('Invalid review');
  const game = games.get(review.game_id), card = node('article',undefined,'review-card'), header = node('header'), heading = node('div'), h3 = node('h3');
  if (game) { const link = node('a',game.name); link.href = game.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; h3.append(link); } else { h3.textContent = '未知游戏'; }
  heading.append(h3,node('p',/^\d{4}-\d{2}-\d{2}$/.test(review.created_on) ? `提交日期 ${review.created_on} · UTC` : '提交日期未知','review-meta'));
  header.append(heading,node('span',labels[review.status],`badge ${review.status}`));
  card.append(header,node('p',review.body,'review-body'));
  const actions = node('div',undefined,'review-actions');
  for (const status of ['approved','rejected','pending']) {
   if (status === review.status) continue;
   const text = status === 'approved' ? '通过并公开' : status === 'rejected' ? (review.status === 'approved' ? '下架并拒绝' : '拒绝') : '重新待审';
   const button = node('button',text,status === 'approved' ? 'primary' : status === 'rejected' ? 'reject' : 'quiet'); button.type = 'button';
   button.addEventListener('click',() => showConfirm(card,review,status,button)); actions.append(button);
  }
  card.append(actions); $('review-list').append(card);
 }
 function dismissConfirm() { if (activeConfirm) { activeConfirm.pane.remove(); const button = activeConfirm.trigger; activeConfirm = null; button.focus(); } }
 function showConfirm(card, review, status, trigger) {
  if (loading || mutating || !authorized) return;
  dismissConfirm();
  const pane = node('div',undefined,'confirm-action');
  pane.setAttribute('role','group'); pane.setAttribute('aria-label','确认审核操作');
  const description = status === 'approved' ? '确认公开这条评价？它会显示在游戏页面，所有访客都能看到。' : status === 'rejected' ? '确认拒绝这条评价？它会保留在管理页，不再公开显示。' : '确认重新设为待审核？它会从公开页面隐藏，等待你再次审核。';
  pane.append(node('p',description));
  const actions = node('div'), confirm = node('button',status === 'approved' ? '确认公开' : status === 'rejected' ? '确认拒绝' : '确认重新待审','primary'), cancel = node('button','取消','quiet');
  confirm.type = cancel.type = 'button'; confirm.addEventListener('click',() => changeStatus(review,status)); cancel.addEventListener('click',dismissConfirm);
  actions.append(confirm,cancel); pane.append(actions); card.append(pane); activeConfirm = {pane,trigger}; confirm.focus();
 }
 async function changeStatus(review, status) {
  if (loading || mutating || !authorized || disposed) return;
  const currentEpoch = epoch;
  mutating = true; lockControls(); notice('正在保存审核结果…');
  let resultMessage = '', failed = false;
  try {
   const {data,error} = await client.rpc('review_admin_set_status',{p_id:review.id,p_expected_status:review.status,p_status:status});
   if (disposed || currentEpoch !== epoch) return;
   if (error) throw error;
   if (data?.id !== review.id || data?.status !== status) throw new Error('Invalid response');
   resultMessage = status === 'approved' ? '已通过，评价已公开。' : status === 'rejected' ? '已拒绝，评价不会公开显示。' : '已重新设为待审核，评价已从公开页面隐藏。';
  } catch (error) {
   if (disposed || currentEpoch !== epoch) return;
   if (isDenied(error)) return expire('登录已失效或没有管理权限，请重新登录。');
   resultMessage = errorText(error,'save'); failed = true;
  } finally { if (currentEpoch === epoch) { mutating = false; lockControls(); } }
  if (currentEpoch === epoch && !disposed) { notice(resultMessage,failed); await listReviews({keepNotice:true}); }
 }
 async function checkSession(session) {
  if (disposed || logoutBusy || locked) return;
  clearPrivateView(); $('login').hidden = true;
  if (!session) { $('login').hidden = false; notice(''); return; }
  const currentEpoch = epoch; notice('正在验证管理员权限…');
  try {
   const {data:userData,error:userError} = await client.auth.getUser(); if (userError || !userData?.user) throw userError || new Error('Missing user');
   if (disposed || currentEpoch !== epoch) return;
   userId = userData.user.id; $('account-label').textContent = userData.user.email || '已登录账号'; $('account').hidden = false;
   const {data,error} = await client.rpc('review_admin_status');
   if (disposed || currentEpoch !== epoch) return;
   if (error) throw error;
   if (data !== true) { $('denied').hidden = false; notice('此账号未获授权，无法读取或更改评价。',true); return; }
   authorized = true; offset = 0; $('workspace').hidden = false; await listReviews();
  } catch (error) {
   if (disposed || currentEpoch !== epoch) return;
   if (isDenied(error) || !userId) return expire('登录链接已失效或登录验证失败，请重新获取链接。');
   $('denied').hidden = true; notice(errorText(error,'load'),true);
   // Keep logout available and provide a retry, without exposing review content.
   const retry = node('button','重新验证','quiet'); retry.type = 'button'; retry.addEventListener('click',() => { retry.remove(); checkSession(session); }); $('notice').append(document.createTextNode(' '),retry);
  }
 }
 async function sendLink(event) {
  event.preventDefault();
  if (authBusy || disposed) return;
  const email = $('email').value.trim(); if (!email || !$('email').checkValidity()) { $('email').reportValidity(); return; }
  authBusy = true; $('send-link').disabled = true; notice('正在发送登录链接…');
  try {
   const redirect = new URL('admin.html',window.location.href); redirect.search = ''; redirect.hash = '';
   const {error} = await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirect.href}});
   if (disposed) return;
   if (error) throw error;
   notice('登录链接已发送。请检查收件箱和垃圾邮件，然后打开邮件中的链接。60 秒后可重新发送。');
   $('send-link').textContent = '60 秒后可重新发送';
   sendTimer = setTimeout(() => {authBusy = false; $('send-link').disabled = false; $('send-link').textContent = '重新发送登录链接';},60000);
  } catch (error) { if (!disposed) { notice(errorText(error,'signin'),true); authBusy = false; $('send-link').disabled = false; } }
 }
 async function logout() {
  if (logoutBusy) return;
  logoutBusy = true; locked = true; client.auth.stopAutoRefresh(); const wasMutating = mutating; clearPrivateView(); $('login').hidden = false; notice('正在退出登录…');
  try {
   const {error} = await client.auth.signOut({scope:'local'});
   // signOut errors can leave the SDK's cached token; clear this tab's storage too.
   try { window.sessionStorage.removeItem('kris-review-admin-session'); } catch (_) { /* Storage already unavailable. */ }
   notice(error ? '本页已锁定，但未能确认服务器退出。请联网后重新登录并退出，或关闭此标签页。' : wasMutating ? '已退出。刚才的审核操作可能已经保存，下次登录后请核对状态。' : '已退出登录。',Boolean(error));
  } catch (_) { try { window.sessionStorage.removeItem('kris-review-admin-session'); } catch (_) {} notice('本页已锁定，但未能确认服务器退出。请关闭此标签页。',true); }
  finally { logoutBusy = false; }
 }
 async function start() {
  try {
   if (!config || config.url !== 'https://oxzudyliysixpflfxsye.supabase.co' || !config.publishableKey?.startsWith('sb_publishable_') || typeof window.supabase?.createClient !== 'function') throw new Error('Configuration');
   const storage = window.sessionStorage; storage.setItem('kris-admin-storage-check','1'); storage.removeItem('kris-admin-storage-check');
   client = window.supabase.createClient(config.url,config.publishableKey,{auth:{storage,storageKey:'kris-review-admin-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:(url,params) => {
    const callback = Boolean(params.access_token || params.error || params.error_code || params.error_description);
    // The SDK has parsed the callback by this point. Replace, rather than append,
    // the history entry before it awaits any network request or clears the hash.
    if (callback) window.history.replaceState(null,'',url.pathname);
    return callback;
   },flowType:'implicit'}});
   for (const game of games.values()) { const option = node('option',game.name); option.value = game.id; $('game-filter').append(option); }
   $('login-form').addEventListener('submit',sendLink); $('logout').addEventListener('click',logout);
   $('refresh').addEventListener('click',() => listReviews());
   $('game-filter').addEventListener('change',() => {offset = 0; listReviews();});
   document.querySelectorAll('[data-status]').forEach(button => button.addEventListener('click',() => { if (loading || mutating) return; selectedStatus = button.dataset.status; offset = 0; document.querySelectorAll('[data-status]').forEach(b => b.setAttribute('aria-pressed',String(b === button))); listReviews(); }));
   $('previous').addEventListener('click',() => {if (loading || mutating) return; offset = Math.max(0,offset-pageSize); listReviews();});
   $('next').addEventListener('click',() => {if (loading || mutating) return; offset += pageSize; listReviews();});
   document.addEventListener('keydown',event => {if (event.key === 'Escape' && !mutating) dismissConfirm();});
   const {error:initializationError} = await client.auth.initialize();
   const {data,error} = await client.auth.getSession();
   // Auth callbacks must not await other Auth methods while the SDK holds its lock.
   client.auth.onAuthStateChange(event => {
    if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || locked || disposed) return;
    // Supabase broadcasts Auth events between tabs even with sessionStorage.
    // Read this tab's session; never sign out in response to another tab's token.
    setTimeout(async () => {
     if (locked || disposed || logoutBusy) return;
     const {data:local,error:localError} = await client.auth.getSession();
     if (locked || disposed || logoutBusy) return;
     if (localError || !local?.session) {
      if (event === 'SIGNED_OUT' || authorized) {clearPrivateView(); $('login').hidden = false; notice('已退出登录。');}
      return;
     }
     if (!authorized || userId !== local.session.user?.id || event !== 'SIGNED_IN') checkSession(local.session);
    },0);
   });
   if (error || (initializationError && !data.session)) { $('login').hidden = false; notice('登录链接已失效，请重新发送登录链接。',true); return; }
   await checkSession(data.session);
  } catch (_) {clearPrivateView(); notice('管理页未能启动。请允许此网站使用会话存储，并刷新页面；若仍失败，请稍后重试。',true);}
 }
 window.addEventListener('pagehide',() => {disposed = true; clearPrivateView(); if(sendTimer) clearTimeout(sendTimer); client?.auth.stopAutoRefresh();});
 window.addEventListener('pageshow',event => {if(event.persisted) window.location.reload();});
 start();
})();

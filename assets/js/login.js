/* ==========================================================================
   login.js —— 登录 / 注册页逻辑
   ========================================================================== */

const els = {
  form: document.getElementById('auth-form'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  submitBtn: document.getElementById('submit-btn'),
  msg: document.getElementById('form-msg'),
  switchText: document.getElementById('switch-text'),
  switchLink: document.getElementById('switch-link')
};

let isRegister = false; // 当前是登录还是注册模式

function setMsg(text, type) {
  els.msg.textContent = text;
  els.msg.className = 'form-msg ' + (type || '');
}

function updateMode() {
  els.submitBtn.textContent = isRegister ? '注 册' : '登 录';
  els.switchText.textContent = isRegister ? '已有账号？' : '还没有账号？';
  els.switchLink.textContent = isRegister ? '去登录' : '去注册';
  els.password.placeholder = isRegister ? '至少 6 位' : '密码';
}

async function onSubmit(e) {
  e.preventDefault();

  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email || !password) {
    setMsg('请填写邮箱和密码', 'err');
    return;
  }
  if (isRegister && password.length < 6) {
    setMsg('密码至少 6 位', 'err');
    return;
  }

  els.submitBtn.disabled = true;

  const res = isRegister
    ? await signUp(email, password)
    : await signIn(email, password);

  if (res.error) {
    setMsg('出错了：' + res.error.message, 'err');
    els.submitBtn.disabled = false;
    return;
  }

  // 注册成功但需确认邮箱的情况
  if (isRegister && res.data && res.data.user && !res.data.session) {
    setMsg('注册成功！请查收邮箱完成确认后再登录（或直接尝试登录）', 'ok');
    els.submitBtn.disabled = false;
    return;
  }

  setMsg('成功！正在进入…', 'ok');

  // 首次登录：把本地老照片迁入账号
  await migrateIfNeeded();

  window.location.href = 'index.html';
}

els.form.addEventListener('submit', onSubmit);
els.switchLink.addEventListener('click', (e) => {
  e.preventDefault();
  isRegister = !isRegister;
  updateMode();
  setMsg('');
});

// 已登录则直接进首页
(async function () {
  const user = await currentUser();
  if (user) {
    await migrateIfNeeded();
    window.location.href = 'index.html';
  }
})();

updateMode();

// 모바일 메뉴, 같은 페이지 안의 이동, 주소 복사, 한 번만 나타나는 콘텐츠.
(() => {
  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  const pendingReveals = new Set(revealTargets);
  let revealObserver;
  // 바로가기와 초점 이동에서는 모션을 기다리지 않고 해당 내용을 보여 준다.
  const finishReveals = (root = document) => {
    revealTargets.forEach((target) => {
      if (root.contains(target) || target.contains(root)) {
        pendingReveals.delete(target);
        revealObserver?.unobserve(target);
        target.classList.remove('is-revealing');
      }
    });
  };
  const finishHashReveals = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (target) finishReveals(target);
  };

  const toggle = document.querySelector('.menu-toggle');
  const panel = document.getElementById('site-nav');
  if (toggle && panel) {
    const header = toggle.closest('.site-header');
    const setOpen = (open, focus = true) => {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open && focus) panel.querySelector('a')?.focus();
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false, false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) { setOpen(false, false); toggle.focus(); }
    });
    // iOS Safari 는 글자만 있는 곳을 눌러도 click 이 오지 않을 수 있어 pointerdown 으로 바깥 누름을 받는다.
    document.addEventListener('pointerdown', (e) => {
      if (panel.classList.contains('is-open') && !header.contains(e.target)) setOpen(false, false);
    });
    // Tab 으로 메뉴를 벗어나면 닫는다(열린 패널 뒤로 초점이 숨지 않게).
    header.addEventListener('focusout', (e) => {
      if (panel.classList.contains('is-open') && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false, false);
    });
    matchMedia('(min-width: 48em)').addEventListener('change', (m) => { if (m.matches) setOpen(false, false); });
    // 뒤로 가기로 복원된 화면에 이전에 열었던 메뉴가 남지 않게 한다.
    window.addEventListener('pageshow', () => setOpen(false, false));
  }

  // 분류와 바로가기는 현재 페이지의 위치만 바꾼다. 뒤로 가기는 이전 페이지로 돌아간다.
  // 실제 href를 유지하므로 새 탭, 링크 복사, JS 없는 탐색도 그대로 사용할 수 있다.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = id ? document.getElementById(id) : document.getElementById('top');
    if (!target) return;
    // replaceState에 실패하는 환경에서는 브라우저의 기본 링크 이동을 사용한다.
    try { history.replaceState(history.state, '', url); } catch { return; }
    event.preventDefault();
    finishReveals(target);
    const focusTarget = target.querySelector('h1, h2') || target;
    if (!focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
    }
    focusTarget.focus({ preventScroll: true });
    focusTarget.scrollIntoView({ block: 'start' });
  });

  const copyBtn = document.querySelector('[data-copy]');
  if (copyBtn) {
    const label = copyBtn.querySelector('.btn-quiet__label');
    const status = document.getElementById('copy-status');
    let timer;
    copyBtn.addEventListener('click', async () => {
      let ok = true;
      try { await navigator.clipboard.writeText(copyBtn.dataset.copy); } catch { ok = false; }
      if (!ok) { const range = document.createRange(); range.selectNodeContents(document.getElementById('address-text')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); }
      copyBtn.classList.toggle('is-done', ok);
      label.textContent = ok ? '복사했습니다' : '선택했습니다';
      // 같은 문구를 다시 넣어도 화면 읽기 프로그램이 읽도록 비웠다가 넣는다.
      status.textContent = '';
      setTimeout(() => { status.textContent = ok ? '주소를 복사했습니다' : '주소를 선택했습니다. 복사해 주십시오.'; }, 100);
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = '주소 복사'; copyBtn.classList.remove('is-done'); status.textContent = ''; }, 2000);
    });
  }

  // 기본 상태는 항상 표시한다. JS나 관찰 기능이 없어도 빈 영역이 생기지 않는다.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || !pendingReveals.has(target)) return;
        pendingReveals.delete(target);
        revealObserver.unobserve(target);
        target.classList.add('is-revealing');
      });
    }, { threshold: 0.01 });
    revealTargets.forEach((target) => revealObserver.observe(target));
    finishHashReveals();
    document.addEventListener('animationend', (event) => {
      if (event.animationName === 'content-arrive') event.target.classList.remove('is-revealing');
    });
    document.addEventListener('focusin', (event) => finishReveals(event.target));
    window.addEventListener('hashchange', finishHashReveals);
    window.addEventListener('pageshow', (event) => { if (event.persisted) finishReveals(); });
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) {
        revealObserver.disconnect();
        finishReveals();
      }
    });
  }
})();

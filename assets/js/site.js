// 알찬식품 사이트 스크립트: 모바일 메뉴 열고 닫기, 주소 복사. 이 두 가지만 한다.
(() => {
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
  }

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
})();

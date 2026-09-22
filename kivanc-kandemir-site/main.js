/* Psikolog Kıvanç Kandemir – site betiği */
(function () {
  'use strict';
  var WA_NUMBER = '905551980108';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: kaydırma durumu + başa dön ---------- */
  var header = $('.site-header');
  var toTop = $('.to-top');
  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 60);
    if (toTop) toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Mobil menü ---------- */
  var toggle = $('.nav-toggle');
  var menu = $('.menu');
  var iconMenu = toggle ? toggle.innerHTML : '';
  var iconClose = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var setMenu = function (open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    toggle.innerHTML = open ? iconClose : iconMenu;
  };
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target === menu) setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Slider ---------- */
  var slider = $('.slider');
  if (slider) {
    var slides = $$('.slide', slider);
    var dots = $$('.slider-dots button', slider);
    var cur = 0, timer = null, DELAY = 7000;
    var go = function (n) {
      if (n === cur) return;
      slides[cur].classList.remove('is-active'); slides[cur].setAttribute('aria-hidden', 'true');
      dots[cur] && dots[cur].classList.remove('is-active');
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('is-active'); slides[cur].removeAttribute('aria-hidden');
      if (dots[cur]) {
        // ilerleme çubuğu animasyonunu baştan başlat
        dots[cur].classList.remove('is-active'); void dots[cur].offsetWidth; dots[cur].classList.add('is-active');
      }
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () {
      stop();
      if (reduceMotion || slides.length < 2) return;
      timer = setInterval(function () { go(cur + 1); }, DELAY);
    };
    var restart = function (n) { go(n); start(); if (dots[cur]) { dots[cur].classList.remove('is-active'); void dots[cur].offsetWidth; dots[cur].classList.add('is-active'); } };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { restart(i); }); });
    var prev = $('.prev', slider), next = $('.next', slider);
    if (prev) prev.addEventListener('click', function () { restart(cur - 1); });
    if (next) next.addEventListener('click', function () { restart(cur + 1); });
    slider.addEventListener('mouseenter', function () { stop(); slider.classList.add('paused'); });
    slider.addEventListener('mouseleave', function () { slider.classList.remove('paused'); start(); });
    // Dokunmatik kaydırma
    var sx = null, sy = null;
    slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) restart(dx < 0 ? cur + 1 : cur - 1);
      sx = sy = null;
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }

  /* ---------- SSS: yumuşak aç/kapa + adres çubuğundan açma ---------- */
  $$('.faq-item').forEach(function (d) {
    var sum = $('summary', d), ans = $('.answer', d);
    if (!sum || !ans || reduceMotion) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) {
        ans.style.height = ans.scrollHeight + 'px';
        requestAnimationFrame(function () { ans.style.height = '0px'; });
        ans.addEventListener('transitionend', function h() { d.open = false; ans.style.height = ''; ans.removeEventListener('transitionend', h); });
      } else {
        d.open = true;
        var target = ans.scrollHeight;
        ans.style.height = '0px';
        requestAnimationFrame(function () { ans.style.height = target + 'px'; });
        ans.addEventListener('transitionend', function h() { ans.style.height = ''; ans.removeEventListener('transitionend', h); });
      }
    });
  });
  var openFromHash = function () {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && el.tagName === 'DETAILS') el.open = true;
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- Arama ---------- */
  var search = $('.search');
  var input = $('#q');
  var results = $('.search-results');
  var openBtn = $('.search-open');
  var lastFocus = null;
  var norm = function (s) {
    return (s || '').toLocaleLowerCase('tr-TR')
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/i̇/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  };
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // Orijinal metinde, normalize edilmiş eşleşmelerin yerini bulup vurgula (Türkçe karakterler 1:1 eşleşir)
  var highlight = function (text, terms) {
    var n = norm(text), marks = [];
    terms.forEach(function (t) {
      var i = 0;
      while (t && (i = n.indexOf(t, i)) !== -1) { marks.push([i, i + t.length]); i += t.length; }
    });
    if (!marks.length) return esc(text);
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    marks.forEach(function (m) {
      if (m[0] < pos) return;
      out += esc(text.slice(pos, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>';
      pos = m[1];
    });
    return out + esc(text.slice(pos));
  };
  var snippet = function (text, terms) {
    var n = norm(text), idx = -1;
    terms.forEach(function (t) { var i = n.indexOf(t); if (i !== -1 && (idx === -1 || i < idx)) idx = i; });
    if (idx < 60) return text.length > 170 ? text.slice(0, 170).replace(/\s+\S*$/, '') + '…' : text;
    var s = text.slice(idx - 50).replace(/^\S*\s/, '');
    return '…' + (s.length > 170 ? s.slice(0, 170).replace(/\s+\S*$/, '') + '…' : s);
  };
  var focusIdx = -1;
  var render = function () {
    if (!results) return;
    var q = norm(input.value.trim());
    focusIdx = -1;
    if (q.length < 2) { results.innerHTML = ''; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var data = window.SEARCH_INDEX || [];
    var hits = data.map(function (d) {
      var t = norm(d.t), x = norm(d.x), c = norm(d.c), score = 0;
      for (var i = 0; i < terms.length; i++) {
        var w = terms[i], inT = t.indexOf(w) !== -1, inX = x.indexOf(w) !== -1, inC = c.indexOf(w) !== -1;
        if (!inT && !inX && !inC) return null;
        score += (inT ? 10 : 0) + (t.indexOf(w) === 0 ? 5 : 0) + (inX ? 2 : 0) + (inC ? 1 : 0);
      }
      return { d: d, s: score };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    if (!hits.length) {
      results.innerHTML = '<li class="search-empty">“' + esc(input.value.trim()) + '” için sonuç bulunamadı. Farklı bir kelime deneyebilir ya da WhatsApp üzerinden sorabilirsiniz.</li>';
      return;
    }
    results.innerHTML = hits.map(function (h) {
      return '<li><a href="' + h.d.u + '"><span class="r-cat">' + esc(h.d.c) + '</span>' +
        '<span class="r-title">' + highlight(h.d.t, terms) + '</span>' +
        '<span class="r-text">' + highlight(snippet(h.d.x, terms), terms) + '</span></a></li>';
    }).join('');
    $$('a', results).forEach(function (a) { a.addEventListener('click', function () { closeSearch(true); }); });
  };
  var openSearch = function () {
    if (!search) return;
    lastFocus = document.activeElement;
    search.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { search.classList.add('open'); input && input.focus(); });
  };
  var closeSearch = function (keepScroll) {
    if (!search || search.hidden) return;
    search.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { search.hidden = true; }, reduceMotion ? 0 : 300);
    if (!keepScroll && lastFocus) lastFocus.focus();
  };
  if (search && input) {
    openBtn && openBtn.addEventListener('click', openSearch);
    $('.search-close', search).addEventListener('click', function () { closeSearch(); });
    search.addEventListener('click', function (e) { if (e.target === search) closeSearch(); });
    input.addEventListener('input', render);
    $$('.search-hint button', search).forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-q'); render(); input.focus(); });
    });
    $('.search-form', search).addEventListener('submit', function (e) {
      e.preventDefault();
      var links = $$('a', results);
      var target = links[focusIdx > -1 ? focusIdx : 0];
      if (target) { closeSearch(true); location.href = target.getAttribute('href'); }
    });
    input.addEventListener('keydown', function (e) {
      var links = $$('a', results);
      if (!links.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusIdx = (focusIdx + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach(function (l, i) { l.classList.toggle('is-focus', i === focusIdx); });
        links[focusIdx].scrollIntoView({ block: 'nearest' });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeSearch(); setMenu(false); }
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (e.key === '/' && search.hidden && !/INPUT|TEXTAREA|SELECT/.test(tag)) { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- Randevu formu → WhatsApp ---------- */
  $$('.appt-form').forEach(function (f) {
    var date = $('input[type="date"]', f);
    if (date) {
      var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
      date.min = t.toISOString().slice(0, 10);
    }
    var err = $('.form-error', f);
    $$('input, select, textarea', f).forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ''; };
      var ok = true;
      ['ad', 'tel'].forEach(function (n) {
        var el = f.elements[n];
        var bad = !el.value.trim() || (n === 'tel' && el.value.replace(/\D/g, '').length < 10);
        el.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (err) err.hidden = ok;
      if (!ok) { var first = $('.invalid', f); first && first.focus(); return; }
      var tarih = v('tarih');
      if (tarih) { var p = tarih.split('-'); tarih = p[2] + '.' + p[1] + '.' + p[0]; }
      var lines = ['Merhaba, randevu talebinde bulunmak istiyorum.', '', 'Ad Soyad: ' + v('ad'), 'Telefon: ' + v('tel')];
      if (v('mail')) lines.push('E-posta: ' + v('mail'));
      if (v('hizmet')) lines.push('Hizmet: ' + v('hizmet'));
      if (tarih) lines.push('Tercih edilen tarih: ' + tarih);
      if (v('mesaj')) lines.push('', 'Mesaj: ' + v('mesaj'));
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });

  /* ---------- Kaydırdıkça beliren içerik ---------- */
  var SEL = ['.sec-title > *', '.welcome-text > p', '.welcome-text .btn-row', '.appt-card', '.about-img', '.prose > p', '.prose > .btn', '.facts',
    '.svc', '.mcard', '.dcard', '.steps li', '.booking-form', '.booking-info .clist li', '.contact-info .clist li', '.contact-form',
    '.faq-item', '.faq-home-grid .btn', '.side-card', '.map-card', '.banner .wrap > *', '.cta-inner > *', '.fcols > *'].join(',');
  var items = $$(SEL);
  items.forEach(function (el) {
    el.classList.add('reveal');
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(SEL); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 110 + 'ms');
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
})();

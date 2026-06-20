/* VIETNAMCOCO — framework-free behaviors (replaces Claude Design runtime).
   Reads per-page dictionary from window.__VNC_T and figures from window.__VNC_FIG. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var T = window.__VNC_T || {};
    var FIG = window.__VNC_FIG || null;
    var root = document;

    /* i18n */
    function applyLang(lang) {
      root.querySelectorAll('[data-t]').forEach(function (el) {
        var d = T[el.getAttribute('data-t')];
        if (d && d[lang] != null) el.textContent = d[lang];
      });
      root.querySelectorAll('[data-t-ph]').forEach(function (el) {
        var d = T[el.getAttribute('data-t-ph')];
        if (d && d[lang] != null) el.setAttribute('placeholder', d[lang]);
      });
      root.querySelectorAll('[data-lang-btn]').forEach(function (b) {
        var on = b.getAttribute('data-lang-btn') === lang;
        b.style.color = on ? '#B8863C' : '#C9D2BE';
        b.style.fontWeight = on ? '700' : '400';
      });
      var lc = root.querySelector('[data-lang-current]');
      if (lc) lc.textContent = lang.toUpperCase();
      try { localStorage.setItem('vnc_lang', lang); } catch (e) {}
      try { document.documentElement.setAttribute('lang', lang); } catch (e) {}
      window.__VNC_LANG = lang;
    }
    root.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-btn')); });
    });
    var ldd = root.querySelector('[data-langdd]');
    if (ldd) {
      var tog = ldd.querySelector('[data-lang-toggle]');
      var pan = ldd.querySelector('[data-lang-panel]');
      if (tog && pan) {
        tog.addEventListener('click', function (e) {
          e.stopPropagation();
          pan.style.display = (pan.style.display === 'flex') ? 'none' : 'flex';
        });
        ldd.querySelectorAll('[data-lang-btn]').forEach(function (b) {
          b.addEventListener('click', function () { if (window.innerWidth >= 1025) pan.style.display = 'none'; });
        });
        document.addEventListener('click', function (e) { if (!ldd.contains(e.target)) pan.style.display = 'none'; });
      }
    }

    /* scroll reveal */
    var reveal = function (el) { el.style.opacity = '1'; el.style.transform = 'none'; };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
      root.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
    } else {
      root.querySelectorAll('[data-reveal]').forEach(reveal);
    }

    /* nav hamburger */
    var nav = root.querySelector('nav');
    if (nav) {
      var burger = nav.querySelector('[data-burger]');
      var links = nav.querySelector('[data-navlinks]');
      if (burger && links) {
        burger.addEventListener('click', function () {
          if (links.hasAttribute('data-open')) links.removeAttribute('data-open');
          else links.setAttribute('data-open', '');
        });
        links.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () { links.removeAttribute('data-open'); });
        });
      }
    }

    /* mega dropdown (desktop hover) */
    root.querySelectorAll('[data-dd]').forEach(function (dd) {
      var panel = dd.querySelector('[data-dd-panel]');
      if (!panel) return;
      var tm;
      dd.addEventListener('mouseenter', function () { clearTimeout(tm); if (window.innerWidth >= 1025) panel.style.display = 'flex'; });
      dd.addEventListener('mouseleave', function () { tm = setTimeout(function () { if (window.innerWidth >= 1025) panel.style.display = 'none'; }, 140); });
    });

    /* style-hover */
    root.querySelectorAll('[style-hover]').forEach(function (el) {
      var hov = el.getAttribute('style-hover');
      if (!hov) return;
      el.addEventListener('mouseenter', function () {
        el.setAttribute('data-base-style', el.getAttribute('style') || '');
        el.style.cssText = (el.getAttribute('data-base-style') || '') + ';' + hov;
      });
      el.addEventListener('mouseleave', function () { el.style.cssText = el.getAttribute('data-base-style') || ''; });
    });

    /* style-focus (form inputs) */
    root.querySelectorAll('[style-focus]').forEach(function (el) {
      var f = el.getAttribute('style-focus');
      if (!f) return;
      el.addEventListener('focus', function () {
        el.setAttribute('data-fbase', el.getAttribute('style') || '');
        el.style.cssText = (el.getAttribute('data-fbase') || '') + ';' + f;
      });
      el.addEventListener('blur', function () { el.style.cssText = el.getAttribute('data-fbase') || ''; });
    });

    /* figures count-up */
    function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
    function animateFigures() {
      if (!FIG) return;
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
      FIG.forEach(function (f, i) {
        var el = root.querySelector('[data-fig="' + i + '"]');
        if (!el) return;
        var dur = 1200, start = null;
        var tick = function (now) {
          if (!start) start = now;
          var p = Math.min((now - start) / dur, 1);
          el.textContent = (f.pre || '') + fmt((f.to || 0) * ease(p)) + (f.post || '');
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = (f.pre || '') + fmt(f.to || 0) + (f.post || '');
        };
        requestAnimationFrame(tick);
      });
    }
    setTimeout(animateFigures, 300);

    /* forms -> POST /api/lead (Cloudflare Pages Function) */
    function showFormError(form) {
      var er = form.querySelector('[data-lead-error]');
      if (!er) {
        er = document.createElement('div');
        er.setAttribute('data-lead-error', '');
        er.style.cssText = "color:#9c3a2e;font-family:'IBM Plex Mono',monospace;font-size:12px;margin-top:8px";
        er.textContent = 'Gửi không thành công — vui lòng thử lại, hoặc email welcome@vietnamcoco.vn';
        form.appendChild(er);
      }
      er.style.display = 'block';
    }
    function submitLead(form, okEl) {
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('[type="submit"]');
        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = '…'; }
        var er = form.querySelector('[data-lead-error]'); if (er) er.style.display = 'none';
        var obj = {};
        new FormData(form).forEach(function (v, k) { obj[k] = v; });
        fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) })
          .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
          .then(function (res) {
            if (res && res.ok) { form.style.display = 'none'; if (okEl) okEl.style.display = 'block'; }
            else { throw new Error('failed'); }
          })
          .catch(function () { if (btn) { btn.disabled = false; btn.textContent = label; } showFormError(form); });
      });
    }
    submitLead(root.querySelector('form[data-contact]'), root.querySelector('[data-success]'));
    submitLead(root.querySelector('form[data-nl]'), root.querySelector('[data-nl-ok]'));

    /* insights category filter */
    var filters = root.querySelectorAll('[data-filter]');
    if (filters.length) {
      var applyFilter = function (key) {
        root.querySelectorAll('[data-filter]').forEach(function (b) {
          var on = b.getAttribute('data-filter') === key;
          b.style.background = on ? '#0E3B2C' : 'transparent';
          b.style.color = on ? '#E8E3D4' : '#473f34';
          b.style.borderColor = on ? '#0E3B2C' : 'rgba(23,19,15,.18)';
        });
        var shown = 0;
        root.querySelectorAll('[data-grid] [data-post]').forEach(function (card) {
          var match = key === 'all' || card.getAttribute('data-category') === key;
          card.style.display = match ? 'flex' : 'none';
          if (match) shown++;
        });
        var empty = root.querySelector('[data-empty]'); if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
      };
      filters.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); }); });
    }

    /* desiccated request modal */
    var modal = root.querySelector('[data-modal]');
    if (modal) {
      var mform = modal.querySelector('[data-modal-form]');
      var mok = modal.querySelector('[data-modal-ok]');
      var paint = function () {
        modal.querySelectorAll('[data-modal-type] input').forEach(function (i) {
          var sp = i.nextElementSibling;
          if (!sp) return;
          if (i.checked) { sp.style.background = '#B8863C'; sp.style.color = '#231a0c'; sp.style.borderColor = '#B8863C'; }
          else { sp.style.background = 'none'; sp.style.color = '#0E3B2C'; sp.style.borderColor = 'rgba(14,59,44,.3)'; }
        });
      };
      var open = function (type) {
        var r = modal.querySelector('[data-modal-type] input[value="' + type + '"]');
        if (r) r.checked = true;
        paint();
        if (mform) mform.style.display = 'grid';
        if (mok) mok.style.display = 'none';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      };
      var close = function () { modal.style.display = 'none'; document.body.style.overflow = ''; };
      root.querySelectorAll('[data-modal-open]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); open(b.getAttribute('data-modal-open')); });
      });
      var c = modal.querySelector('[data-modal-close]'); if (c) c.addEventListener('click', close);
      var bd = modal.querySelector('[data-modal-backdrop]'); if (bd) bd.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.style.display === 'flex') close(); });
      modal.querySelectorAll('[data-modal-type] input').forEach(function (i) { i.addEventListener('change', paint); });
      if (mform) submitLead(mform, mok);
      paint();
    }

    /* initial language */
    var stored = 'en';
    try { stored = localStorage.getItem('vnc_lang') || 'en'; } catch (e) {}
    applyLang(stored);
  });
})();

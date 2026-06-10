gsap.registerPlugin(ScrollTrigger);

/* ── 1. CURSOR ──────────────────────────────── */
(function () {
    const dot = document.createElement('div');
    dot.className = 'cursor';
    document.body.appendChild(dot);

    document.addEventListener('mousemove', e => {
        dot.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
    });

    const hoverTargets = 'a, button, h1, h2, h3, p, span, li, img, blockquote, video';
    document.addEventListener('mouseover', e => { if (e.target.closest(hoverTargets)) dot.classList.add('hover'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hoverTargets)) dot.classList.remove('hover'); });
})();


/* ── 2. IRIS NOIR ───────────────────────────── */
(function () {
    const W = innerWidth, H = innerHeight;
    const maxR = Math.hypot(W, H);
    const cx = W / 2, cy = H / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'iris-overlay';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    Object.assign(svg.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '9999', pointerEvents: 'none' });

    svg.innerHTML = `
  <defs>
    <radialGradient id="iris-grad" cx="${cx}" cy="${cy}" r="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="black" stop-opacity="0"/>
      <stop offset="60%"  stop-color="black" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="black" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#iris-grad)" opacity="0.4"/>
`;
    document.body.prepend(svg);

    const grad = svg.querySelector('#iris-grad');
    const easeOut = t => 1 - Math.pow(1 - t, 2);

    function animateR(from, to, duration, ease, done) {
        const start = performance.now();
        (function step(now) {
            const t = Math.min((now - start) / duration, 1);
            grad.setAttribute('r', Math.max(0, from + (to - from) * ease(t)));
            t < 1 ? requestAnimationFrame(step) : done?.();
        })(start);
    }

    animateR(0, maxR, 4000, easeOut, () => {
        svg.remove();
        if (typeof startReveal === 'function') startReveal();
    });
})();


/* ── 3. MENÚ ────────────────────────────────── */
(function () {
    const toggle = document.querySelector('.menu-toggle');
    const panel = document.querySelector('.mega-menu');
    if (!toggle || !panel) return;

    const bgCircle = panel.querySelector('.menu-bg-circle circle');
    const svgEl = panel.querySelector('.menu-bg-circle');
    const links = panel.querySelectorAll('.menu-list a');
    const menuX = toggle.querySelector('.menu-x');
    let isOpen = false;

    function setSVGSize() {
        const { innerWidth: W, innerHeight: H } = window;
        svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svgEl.setAttribute('width', W);
        svgEl.setAttribute('height', H);
        const r = toggle.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        bgCircle.setAttribute('cx', cx);
        bgCircle.setAttribute('cy', cy);
        bgCircle.dataset.maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    }

    setSVGSize();
    window.addEventListener('resize', setSVGSize);
    gsap.set(bgCircle, { attr: { r: 0 } });
    gsap.set(links, { yPercent: 110 });
    gsap.set(menuX, { opacity: 0 });

    function openMenu() {
        panel.style.visibility = 'visible';
        panel.style.pointerEvents = 'auto';
        gsap.timeline()
            .to(bgCircle, { attr: { r: bgCircle.dataset.maxR }, duration: 0.8, ease: 'power3.inOut' })
            .to(links, { yPercent: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' }, '-=0.3')
            .to(menuX, { opacity: 1, duration: 0.2 }, '-=0.4');
    }

    function closeMenu() {
        gsap.timeline({ onComplete: () => { panel.style.visibility = 'hidden'; panel.style.pointerEvents = 'none'; } })
            .to(menuX, { opacity: 0, duration: 0.15 })
            .to(links, { yPercent: 110, duration: 0.3, stagger: 0.04, ease: 'power2.in' }, '<')
            .to(bgCircle, { attr: { r: 0 }, duration: 0.7, ease: 'power3.inOut' }, '-=0.1');
    }

    function toggleMenu() {
        isOpen = !isOpen;
        toggle.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        isOpen ? openMenu() : closeMenu();
    }

    links.forEach(link => {
        const el = link.querySelector('.link-scramble');
        const original = link.dataset.text;

        el.innerHTML = original.split('').map(c =>
            c === ' ' ? '<span class="char">&nbsp;</span>' : `<span class="char">${c}</span>`
        ).join('');

        const chars = [...el.querySelectorAll('.char')];

        function closestIndex(mouseX) {
            return chars.reduce((best, char, i) => {
                const dist = Math.abs(mouseX - (char.getBoundingClientRect().left + char.getBoundingClientRect().width / 2));
                return dist < best.dist ? { i, dist } : best;
            }, { i: 0, dist: Infinity }).i;
        }

        link.addEventListener('mousemove', e => {
            const center = closestIndex(e.clientX);
            chars.forEach((char, i) => {
                gsap.to(char, { fontSize: '1.3em', duration: 0.15, delay: Math.abs(i - center) * 0.04, ease: 'power2.out', overwrite: true });
            });
        });
        link.addEventListener('mouseleave', () => {
            gsap.to(chars, { fontSize: '1em', duration: 0.3, stagger: 0.015, ease: 'power2.in', overwrite: true });
        });
        link.addEventListener('click', () => {
            if (!isOpen) return;
            isOpen = false;
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            closeMenu();
        });
    });

    toggle.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', e => e.key === 'Escape' && isOpen && toggleMenu());
})();


/* ── 4. SCROLL REVEAL ───────────────────────── */
function startReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.07 });
    document.querySelectorAll('.sr').forEach(el => obs.observe(el));
}


/* ── 5. HEADER SVG ANIMATION ────────────────── */
(function () {
    function init() {
        const contorno = document.querySelectorAll('#Contorno path');
        const fondo = document.querySelectorAll('#Fondo path');
        const letras = document.querySelectorAll('#Letras path');
        const cronica = document.querySelectorAll('#Cronica path');
        const leyenda = document.querySelectorAll('#svg-leyenda path');

        contorno.forEach(path => {
            const len = path.getTotalLength();
            gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, fill: 'none', opacity: 1 });
        });
        gsap.set([fondo, letras, cronica, leyenda], { opacity: 0, y: 8 });

        gsap.timeline({ delay: 0.4, defaults: { ease: 'power3.out' } })
            .to(contorno, { strokeDashoffset: 0, duration: 1.2, stagger: 0.04, ease: 'power2.inOut' })
            .to(contorno, { fill: '', duration: 0.3, stagger: 0.02 }, '-=0.6')
            .to(fondo, { opacity: 1, y: 0, duration: 0.3, stagger: 0.012 }, '-=0.3')
            .to(letras, { opacity: 1, y: 0, duration: 0.3, stagger: 0.018 }, '-=0.2')
            .to([cronica, leyenda], { opacity: 1, y: 0, duration: 0.5, stagger: 0.012 }, '-=0.3');
    }
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();


/* ── 6. HEADER ZOOM ─────────────────────────── */
(function () {
    function init() {
        const header = document.querySelector('header');
        const headerBg = document.querySelector('.header-bg');
        const headerSvg = document.querySelector('.header-content svg');
        if (!header || !headerBg || !headerSvg) return;

        const overlay = document.createElement('div');
        Object.assign(overlay.style, { position: 'absolute', inset: '0', background: '#0f0f0f', opacity: '0', zIndex: '4', pointerEvents: 'none' });
        header.appendChild(overlay);

        gsap.timeline({
            scrollTrigger: {
                trigger: header,
                start: 'top top',
                end: 'bottom top',
                scrub: 1.6,
                pin: true,
                anticipatePin: 1,
            }
        })
            .to(headerBg, { scale: 1.35, ease: 'none' }, 0)
            .to(headerSvg, { scale: 8, opacity: 0, ease: 'power2.in' }, 0)
            .to(overlay, { opacity: 1, ease: 'power2.inOut' }, 0.65);
    }
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();


/* ── 7. INTRO QUOTE ─────────────────────────── */
(function () {
    const section = document.querySelector('.intro-quote-section');
    if (!section) return;

    const lines = gsap.utils.toArray('.iq-line');
    const finalLine = document.querySelector('.iq-line--final');

    const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1.2 }
    });
    lines.forEach((line, i) => tl.to(line, { opacity: 1, duration: 1 }, i * 0.8));
    tl.to(finalLine, { opacity: 1, duration: 0.8 }, '+=0.3');
    tl.to(lines, { opacity: 0, duration: 0.8 }, '+=0.5');
})();


/* ─────────────────────────────────────────────
   HELPER: crea un ScrollTrigger pinneando el
   cap-pin-wrap completo (no la sección interior).
   El cap-scroll-space ya está adentro del wrap,
   así que pinSpacing: false evita espacio doble.
───────────────────────────────────────────── */
function makePinST(wrap, extraConfig = {}) {
    return {
        trigger: wrap,
        start: 'top top',
        end: () => `+=${wrap.offsetHeight}`,   // usa la altura real (sección + scroll-space)
        pin: wrap,
        pinSpacing: false,   // el scroll-space YA está en el DOM dentro del wrap
        ...extraConfig,
    };
}


/* ── 8. CAP 1 · 4 AMIGOS ────────────────────── */
(function () {

    /* ·· YOUTUBE MANAGER ························ */
    function loadYTApi() {
        if (window.YT || document.getElementById('yt-api-script')) return;
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }

    // Extrae el ID de 11 caracteres de cualquier forma de URL de YouTube
    function extractYTId(raw) {
        if (!raw) return null;
        // ya es un ID limpio (11 chars, sin slash ni punto)
        if (/^[A-Za-z0-9_-]{11}$/.test(raw.trim())) return raw.trim();
        // youtu.be/<ID>
        const short = raw.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (short) return short[1];
        // youtube.com/watch?v=<ID>  o  /embed/<ID>
        const long = raw.match(/(?:v=|\/embed\/)([A-Za-z0-9_-]{11})/);
        if (long) return long[1];
        return null;
    }

    const YTManager = {
        players: {},
        timers: {},
        CLIP_MS: 15000,

        init(paragraphs) {
            loadYTApi();
            const container = document.getElementById('yt-players-amigos5');
            if (!container) return;

            paragraphs.forEach(p => {
                const id = extractYTId(p.dataset.ytId);
                if (!id || document.getElementById(`yt-player-${id}`)) return;
                const div = document.createElement('div');
                div.id = `yt-player-${id}`;
                container.appendChild(div);
                // guarda el ID limpio en el elemento para usarlo después
                p.dataset.ytIdClean = id;
            });

            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { prev?.(); this._createPlayers(paragraphs); };
            if (window.YT?.Player) this._createPlayers(paragraphs);
        },

        _createPlayers(paragraphs) {
            paragraphs.forEach(p => {
                const id = p.dataset.ytIdClean || extractYTId(p.dataset.ytId);
                const start = parseInt(p.dataset.ytStart || '0', 10);
                if (!id || this.players[id]) return;

                this.players[id] = new YT.Player(`yt-player-${id}`, {
                    videoId: id,
                    playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, start },
                    events: { onReady: e => e.target.mute() },
                });
            });
        },

        play(id, startSec = 0) {
            const p = this.players[id];
            if (!p?.playVideo) return;
            this.stop(id);
            p.seekTo(startSec, true);
            p.playVideo();
            setTimeout(() => { try { p.unMute(); p.setVolume(70); } catch (_) { } }, 300);
            this.timers[id] = setTimeout(() => this.stop(id), this.CLIP_MS);
        },

        stop(id) {
            const p = this.players[id];
            if (p?.pauseVideo) { p.pauseVideo(); try { p.mute(); } catch (_) { } }
            clearTimeout(this.timers[id]);
            delete this.timers[id];
        },

        stopAll() { Object.keys(this.players).forEach(id => this.stop(id)); },
    };


    /* ·· BLOQUE 2: grain con scrub ·············· */
    const pinWrap2 = document.getElementById('pin-amigos-2');
    const párrafo2 = pinWrap2?.querySelector('.cap-p--fullbleed');
    const grain = document.getElementById('amigos-grain');

    if (grain && pinWrap2 && párrafo2) {
        gsap.set(párrafo2, { opacity: 0, yPercent: 5 });

        gsap.timeline({ scrollTrigger: makePinST(pinWrap2, { scrub: 1 }) })
            .to(grain, { opacity: 0.6, ease: 'none' }, 0)
            .to(párrafo2, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0.15)
            .to(grain, { opacity: 0, ease: 'none' }, 0.7)
            .to(párrafo2, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.75);
    }


    /* ·· BLOQUES 3 y 4: swap slides ············· */
    const pinWrap34 = document.getElementById('pin-amigos-34');
    if (!pinWrap34) return;

    const slides34 = [...pinWrap34.querySelectorAll('.cap-swap-slide')];
    if (!slides34.length) return;

    gsap.set(slides34, { opacity: 0, pointerEvents: 'none' });
    slides34.forEach(slide => {
        gsap.set(slide.querySelector('.cap-photo-wrap img'), { y: -50, opacity: 0 });
        gsap.set(slide.querySelector('.cap-p'), { opacity: 0, y: 20 });
    });

    let currentSlide = -1;

    function activarSlide(index) {
        if (index === currentSlide) return;
        if (currentSlide >= 0) {
            const prev = slides34[currentSlide];
            gsap.to(prev, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => { prev.style.pointerEvents = 'none'; } });
        }
        currentSlide = index;
        const curr = slides34[index];
        const img = curr.querySelector('.cap-photo-wrap img');
        const texto = curr.querySelector('.cap-p');
        curr.style.pointerEvents = 'auto';
        gsap.to(curr, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        gsap.fromTo(img, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
        gsap.fromTo(texto, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.25 });
    }

    ScrollTrigger.create({
        ...makePinST(pinWrap34),
        onUpdate(self) {
            activarSlide(Math.min(Math.floor(self.progress * slides34.length), slides34.length - 1));
        },
        onLeaveBack() {
            if (currentSlide >= 0) { gsap.to(slides34[currentSlide], { opacity: 0, duration: 0.3 }); currentSlide = -1; }
        },
    });


    /* ·· BLOQUE 5: párrafos + audio YouTube ····· */
    const pinWrap5 = document.getElementById('pin-amigos-5');

    if (pinWrap5) {
        const paragraphs5 = [...pinWrap5.querySelectorAll('.cap-p--fullbleed[data-yt-id]')];

        if (paragraphs5.length) {
            YTManager.init(paragraphs5);
            gsap.set(paragraphs5, { opacity: 0, yPercent: 6 });

            let currentP5 = -1;

            function activarParrafo5(index) {
                if (index === currentP5) return;
                if (currentP5 >= 0) {
                    gsap.to(paragraphs5[currentP5], { opacity: 0, yPercent: -6, duration: 0.4, ease: 'power2.in' });
                    YTManager.stop(paragraphs5[currentP5].dataset.ytIdClean || extractYTId(paragraphs5[currentP5].dataset.ytId));
                }
                currentP5 = index;
                const p = paragraphs5[index];
                const ytId = p.dataset.ytIdClean || extractYTId(p.dataset.ytId);
                const ytStart = parseInt(p.dataset.ytStart || '0', 10);
                gsap.fromTo(p, { opacity: 0, yPercent: 6 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: 'power2.out' });
                YTManager.play(ytId, ytStart);
            }

            ScrollTrigger.create({
                ...makePinST(pinWrap5),
                onUpdate(self) {
                    activarParrafo5(Math.min(Math.floor(self.progress * paragraphs5.length), paragraphs5.length - 1));
                },
                onLeaveBack() {
                    if (currentP5 >= 0) {
                        gsap.to(paragraphs5[currentP5], { opacity: 0, duration: 0.3 });
                        YTManager.stop(paragraphs5[currentP5].dataset.ytIdClean || extractYTId(paragraphs5[currentP5].dataset.ytId));
                        currentP5 = -1;
                    }
                },
                onLeave() { YTManager.stopAll(); },
            });
        }
    }


    /* ·· BLOQUE 6: cierre sobrio ················ */
    const pinWrap6 = document.getElementById('pin-amigos-6');
    if (!pinWrap6) return;

    const párrafo6 = pinWrap6.querySelector('.cap-p--fullbleed');
    if (!párrafo6) return;

    gsap.set(párrafo6, { opacity: 0, yPercent: 5 });
    gsap.timeline({ scrollTrigger: makePinST(pinWrap6, { scrub: 1 }) })
        .to(párrafo6, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0)
        .to(párrafo6, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.7);

})();


/* ── 9. ANATOMÍA · Carrusel ─────────────────── */
(function () {
    const slides = document.querySelectorAll('.anatomia-slide');
    const labelEl = document.getElementById('anatomia-label');
    const counterEl = document.getElementById('anatomia-counter');
    const popup = document.getElementById('anatomia-popup');
    const slidesWrap = document.getElementById('anatomia-slides');
    if (!slides.length || !popup) return;

    const total = slides.length;
    const labels = ['La Caguama · El Vasito', 'La Rocola', 'La Barra'];
    let current = 0, isAnim = false;

    function goTo(index, dir = 1) {
        if (isAnim || index === current) return;
        isAnim = true;
        const prev = current;
        current = ((index % total) + total) % total;
        slides[prev].classList.add(dir > 0 ? 'exit-left' : 'exit-right');
        slides[prev].classList.remove('active');
        Object.assign(slides[current].style, { transform: `translateX(${dir > 0 ? '40px' : '-40px'}) scale(0.98)`, opacity: '0' });
        slides[current].classList.add('active');
        requestAnimationFrame(() => requestAnimationFrame(() => { slides[current].style.transform = ''; slides[current].style.opacity = ''; }));
        setTimeout(() => { slides[prev].classList.remove('exit-left', 'exit-right'); slides[prev].style.transform = slides[prev].style.opacity = ''; isAnim = false; }, 750);
        if (counterEl) counterEl.textContent = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        if (labelEl) { labelEl.style.opacity = '0'; setTimeout(() => { labelEl.textContent = labels[current]; labelEl.style.opacity = '1'; }, 200); }
    }

    document.getElementById('anatomia-prev')?.addEventListener('click', () => goTo(current - 1, -1));
    document.getElementById('anatomia-next')?.addEventListener('click', () => goTo(current + 1, 1));

    let startX = 0, dragging = false;
    slidesWrap.addEventListener('pointerdown', e => { startX = e.clientX; dragging = true; slidesWrap.setPointerCapture(e.pointerId); });
    slidesWrap.addEventListener('pointerup', e => { if (!dragging) return; dragging = false; const dx = e.clientX - startX; if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });

    let accum = 0;
    slidesWrap.addEventListener('wheel', e => {
        e.preventDefault(); accum += e.deltaX || e.deltaY;
        if (Math.abs(accum) > 80) { goTo(current + (accum > 0 ? 1 : -1), accum > 0 ? 1 : -1); accum = 0; }
    }, { passive: false });

    const popupTitle = popup.querySelector('.anatomia-popup-title');
    const popupDesc = popup.querySelector('.anatomia-popup-desc');
    document.querySelectorAll('.anatomia-hotspot').forEach(hotspot => {
        hotspot.addEventListener('mouseenter', () => {
            const target = hotspot.dataset.target;
            hotspot.closest('.anatomia-slide').querySelectorAll('.anatomia-img--select').forEach(img => img.classList.toggle('is-visible', img.dataset.hotspot === target));
            popupTitle.textContent = hotspot.dataset.label;
            popupDesc.textContent = hotspot.dataset.desc;
            popup.classList.add('visible');
        });
        hotspot.addEventListener('mousemove', e => { popup.style.left = e.clientX + 'px'; popup.style.top = e.clientY + 'px'; });
        hotspot.addEventListener('mouseleave', () => { hotspot.closest('.anatomia-slide').querySelectorAll('.anatomia-img--select').forEach(img => img.classList.remove('is-visible')); popup.classList.remove('visible'); });
        hotspot.addEventListener('click', () => { document.querySelectorAll('.anatomia-hotspot').forEach(h => h.classList.remove('active')); hotspot.classList.add('active'); });
    });
})();


/* ── 10. CAP 2 · LA LEYENDA NEGRA ───────────── */
(function () {

    const pinIntro = document.getElementById('pin-leyenda-intro');
    const titleEl = document.getElementById('leyenda-intro-title');
    if (pinIntro && titleEl) {
        gsap.timeline({ scrollTrigger: makePinST(pinIntro, { scrub: 1 }) })
            .to(titleEl, { scale: 0.35, opacity: 0, ease: 'power2.in' }, 0.3);
    }

    const pinL1 = document.getElementById('pin-leyenda-1');
    const imgA = document.getElementById('leyenda-img-a');
    const imgB = document.getElementById('leyenda-img-b');
    const imgC = document.getElementById('leyenda-img-c');
    const textoL1 = document.getElementById('leyenda-texto-1');
    if (pinL1 && imgA && imgB && imgC && textoL1) {
        gsap.set([imgA, imgB, imgC], { opacity: 0, x: -40 });
        gsap.set(textoL1, { opacity: 0, y: 20 });
        gsap.timeline({ scrollTrigger: makePinST(pinL1, { scrub: 1 }) })
            .to(imgA, { opacity: 1, x: 0, ease: 'power2.out' }, 0)
            .to(imgB, { opacity: 1, x: 0, ease: 'power2.out' }, 0.2)
            .to(imgC, { opacity: 1, x: 0, ease: 'power2.out' }, 0.4)
            .to(textoL1, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6);
    }

    const pinL2 = document.getElementById('pin-leyenda-2');
    const svgEl = document.getElementById('leyenda-svg');
    const textoL2 = document.getElementById('leyenda-texto-2');
    if (pinL2 && svgEl && textoL2) {
        gsap.set(svgEl, { scale: 0 });
        gsap.set(textoL2, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinL2, { scrub: 1 }) })
            .to(svgEl, { scale: 1, ease: 'power3.out' }, 0)
            .to(textoL2, { opacity: 1, ease: 'power2.out' }, 0.5);
    }

    const pinL345 = document.getElementById('pin-leyenda-345');
    const col3 = document.getElementById('leyenda-col-3');
    const col4 = document.getElementById('leyenda-col-4');
    const col5 = document.getElementById('leyenda-col-5');
    if (pinL345 && col3 && col4 && col5) {
        gsap.set([col3, col4, col5], { opacity: 0, y: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinL345, { scrub: 1 }) })
            .to(col3, { opacity: 1, y: 0, ease: 'power2.out' }, 0)
            .to(col4, { opacity: 1, y: 0, ease: 'power2.out' }, 0.3)
            .to(col5, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6);
    }

    const pinL6 = document.getElementById('pin-leyenda-6');
    const box6 = document.getElementById('leyenda-6-box');
    if (pinL6 && box6) {
        gsap.set(box6, { opacity: 0, y: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinL6, { scrub: 1 }) })
            .to(box6, { opacity: 1, y: 0, ease: 'power2.out' }, 0.1)
            .to(box6, { opacity: 0, y: -20, ease: 'power2.in' }, 0.75);
    }

    const pinL7 = document.getElementById('pin-leyenda-7');
    const box7 = document.getElementById('leyenda-7-box');
    if (pinL7 && box7) {
        gsap.set(box7, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinL7, { scrub: 1 }) })
            .to(box7, { opacity: 1, ease: 'power2.out' }, 0.1);
    }

    const pinL8 = document.getElementById('pin-leyenda-8');
    const textoL8 = document.getElementById('leyenda-8-texto');
    if (pinL8 && textoL8) {
        const highlight = textoL8.querySelector('.leyenda-highlight');
        gsap.set(textoL8, { opacity: 0, y: 20 });
        gsap.set(highlight, { backgroundColor: 'transparent', color: 'var(--white)' });
        gsap.timeline({ scrollTrigger: makePinST(pinL8, { scrub: 1 }) })
            .to(textoL8, { opacity: 1, y: 0, ease: 'power2.out' }, 0)
            .to(highlight, { backgroundColor: 'var(--mostaza)', color: 'var(--black)', ease: 'none' }, 0.5);
    }

    const pinFinal = document.getElementById('pin-leyenda-final');
    const finalImg = document.getElementById('leyenda-final-img');
    if (pinFinal && finalImg) {
        gsap.set(finalImg, { clipPath: 'inset(100% 0 0 0)' });
        gsap.timeline({ scrollTrigger: makePinST(pinFinal, { scrub: 1.2 }) })
            .to(finalImg, { clipPath: 'inset(0% 0 0 0)', ease: 'none' });
    }

})();


/* ── 12. CAP 3 · DESTRUCCIÓN ─────────────────── */
(function () {

    const pinIntro = document.getElementById('pin-destruccion-intro');
    const p1 = pinIntro?.querySelector('.destruccion-p1');
    const p2 = pinIntro?.querySelector('.destruccion-p2');
    if (pinIntro && p1 && p2) {
        gsap.set([p1, p2], { opacity: 0, y: 20 });
        gsap.timeline({ scrollTrigger: makePinST(pinIntro, { scrub: 1 }) })
            .to(p1, { opacity: 1, y: 0, ease: 'power2.out' }, 0.1)
            .to(p2, { opacity: 1, y: 0, ease: 'power2.out' }, 0.45);
    }

    const pin34 = document.getElementById('pin-destruccion-34');
    const dp3 = document.getElementById('dest-p3');
    const dp4 = document.getElementById('dest-p4');
    if (pin34 && dp3 && dp4) {
        gsap.set([dp3, dp4], { opacity: 0, yPercent: 5 });
        gsap.timeline({ scrollTrigger: makePinST(pin34, { scrub: 1 }) })
            .to(dp3, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0)
            .to(dp3, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.4)
            .to(dp4, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0.55)
            .to(dp4, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.85);
    }

    const pin5 = document.getElementById('pin-destruccion-5');
    const dp5 = document.getElementById('dest-p5');
    if (pin5 && dp5) {
        gsap.set(dp5, { opacity: 0, x: -30 });
        gsap.timeline({ scrollTrigger: makePinST(pin5, { scrub: 1 }) })
            .to(dp5, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1);
    }

    const pin6 = document.getElementById('pin-destruccion-6');
    const dp6 = document.getElementById('dest-p6');
    if (pin6 && dp6) {
        gsap.set(dp6, { opacity: 0, x: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pin6, { scrub: 1 }) })
            .to(dp6, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1);
    }

    const pinMapa = document.getElementById('pin-destruccion-mapa');
    const mapaWrap = document.getElementById('destruccion-mapa-wrap');
    const puntos = [...document.querySelectorAll('.dest-punto')];
    const mapaTexto = document.getElementById('dest-mapa-texto');
    const mapaTextoP = mapaTexto?.querySelector('.dest-mapa-texto-p');
    const popup = document.getElementById('dest-mapa-popup');
    const popupImg = popup?.querySelector('.dest-mapa-popup-img');
    const popupLabel = popup?.querySelector('.dest-mapa-popup-label');

    if (pinMapa && mapaWrap && puntos.length) {
        gsap.set(mapaWrap, { scale: 1 });
        gsap.set(puntos, { opacity: 0 });
        gsap.set(mapaTexto, { opacity: 0 });

        const zoomTargets = [
            { scale: 1.8, xPct: -22, yPct: -38 },
            { scale: 2.2, xPct: -30, yPct: -50 },
            { scale: 2.5, xPct: -35, yPct: -60 },
            { scale: 2.8, xPct: -50, yPct: -70 },
        ];
        let currentPunto = -1;

        function activarPunto(index) {
            if (index === currentPunto) return;
            if (currentPunto >= 0) gsap.to(mapaTexto, { opacity: 0, duration: 0.3 });
            currentPunto = index;
            const punto = puntos[index];
            const z = zoomTargets[index];
            gsap.to(mapaWrap, { scale: z.scale, x: `${z.xPct}%`, y: `${z.yPct}%`, duration: 0.8, ease: 'power2.inOut' });
            gsap.to(punto, { opacity: 1, duration: 0.4, ease: 'power2.out' });
            if (mapaTextoP) mapaTextoP.textContent = punto.dataset.desc;
            gsap.to(mapaTexto, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        }

        ScrollTrigger.create({
            ...makePinST(pinMapa),
            onUpdate(self) { activarPunto(Math.min(Math.floor(self.progress * puntos.length), puntos.length - 1)); },
            onLeaveBack() {
                gsap.to(mapaWrap, { scale: 1, x: 0, y: 0, duration: 0.6 });
                gsap.to(mapaTexto, { opacity: 0, duration: 0.3 });
                gsap.to(puntos, { opacity: 0, duration: 0.3 });
                currentPunto = -1;
            },
        });

        puntos.forEach(punto => {
            punto.addEventListener('mouseenter', () => { if (!popup) return; popupImg.src = punto.dataset.img || ''; popupLabel.textContent = punto.dataset.label || ''; popup.classList.add('visible'); });
            punto.addEventListener('mousemove', e => { popup.style.left = e.clientX + 'px'; popup.style.top = e.clientY + 'px'; });
            punto.addEventListener('mouseleave', () => popup?.classList.remove('visible'));
        });
    }

    const pinFotos = document.getElementById('pin-destruccion-fotos');
    const foto1 = document.getElementById('dest-foto-1');
    const foto2 = document.getElementById('dest-foto-2');
    const foto3 = document.getElementById('dest-foto-3');
    const recuadro = document.getElementById('dest-foto-recuadro');
    if (pinFotos && foto1 && foto2 && foto3) {
        gsap.set([foto1, foto2, foto3], { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(recuadro, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinFotos, { scrub: 1 }) })
            .to(foto1, { clipPath: 'inset(0 0% 0 0)', duration: 0.20, ease: 'power2.out' }, 0)
            .to(foto1, { clipPath: 'inset(0 0 0 100%)', duration: 0.15, ease: 'power2.in' }, 0.25)
            .to(foto2, { clipPath: 'inset(0 0% 0 0)', duration: 0.20, ease: 'power2.out' }, 0.35)
            .to({}, { duration: 0.1 }, 0.6)
            .to(foto2, { clipPath: 'inset(0 0 0 100%)', duration: 0.15, ease: 'power2.in' }, 0.72)
            .to(foto3, { clipPath: 'inset(0 0% 0 0)', duration: 0.20, ease: 'power2.out' }, 0.82)
            .to(foto3, { width: '100vw', height: '100vh', top: '0', left: '0', transform: 'translate(0,0)', borderRadius: 0, duration: 0.25, ease: 'power3.inOut' }, 0.88)
            .to(recuadro, { opacity: 1, duration: 0.15, ease: 'power2.out' }, 0.95);
    }

    const pinFinal = document.getElementById('pin-destruccion-final');
    const finalImgA = document.getElementById('dest-final-img-a');
    const finalImgB = document.getElementById('dest-final-img-b');
    const finalTexto = document.getElementById('dest-final-texto');
    if (pinFinal && finalImgA && finalImgB && finalTexto) {
        gsap.set([finalImgA, finalImgB, finalTexto], { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinFinal, { scrub: 1 }) })
            .to(finalImgA, { opacity: 1, ease: 'power2.out' }, 0)
            .to(finalImgB, { opacity: 1, ease: 'power2.out' }, 0.1)
            .to(finalTexto, { opacity: 1, ease: 'power2.out' }, 0.3)
            .to([finalImgA, finalImgB, finalTexto], { opacity: 0, ease: 'power2.in' }, 0.75);
    }

})();


/* ── 13. CAP 5 · RESISTENCIA ────────────────── */
(function () {

    const pinR1 = document.getElementById('pin-res-1');
    const rp1 = document.getElementById('res-p1');
    if (pinR1 && rp1) {
        gsap.set(rp1, { opacity: 0, yPercent: 5 });
        gsap.timeline({ scrollTrigger: makePinST(pinR1, { scrub: 1 }) })
            .to(rp1, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0)
            .to(rp1, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.7);
    }

    const pinR234 = document.getElementById('pin-res-234');
    const rp2 = document.getElementById('res-p2');
    const rp3 = document.getElementById('res-p3');
    const rp4 = document.getElementById('res-p4');
    if (pinR234 && rp2 && rp3 && rp4) {
        gsap.set(rp2, { opacity: 0, x: -30 });
        gsap.set(rp3, { opacity: 0, x: 30 });
        gsap.set(rp4, { opacity: 0, y: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinR234, { scrub: 1 }) })
            .to(rp2, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1)
            .to(rp3, { opacity: 1, x: 0, ease: 'power2.out' }, 0.35)
            .to(rp4, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6);
    }

    const pinR5 = document.getElementById('pin-res-5');
    const rRec5 = document.getElementById('res-5-recuadro');
    if (pinR5 && rRec5) {
        gsap.set(rRec5, { opacity: 0, y: 20 });
        gsap.timeline({ scrollTrigger: makePinST(pinR5, { scrub: 1 }) })
            .to(rRec5, { opacity: 1, y: 0, ease: 'power2.out' }, 0.2);
    }

    const pinR6 = document.getElementById('pin-res-6');
    const rSvg = document.getElementById('res-svg');
    const rp6 = document.getElementById('res-p6');
    if (pinR6 && rSvg && rp6) {
        gsap.set(rSvg, { scale: 0 });
        gsap.set(rp6, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinR6, { scrub: 1 }) })
            .to(rSvg, { scale: 1, ease: 'power3.out' }, 0)
            .to(rp6, { opacity: 1, ease: 'power2.out' }, 0.5);
    }

    const pinR7 = document.getElementById('pin-res-7');
    const rFoto7 = document.getElementById('res-7-foto');
    const rTxt7 = document.getElementById('res-7-texto');
    const rPatri = document.getElementById('res-patrimonio');
    const rPopup = document.getElementById('res-patrimonio-popup');
    const rPopupP = rPopup?.querySelector('p');
    if (pinR7 && rFoto7 && rTxt7) {
        gsap.set(rFoto7, { opacity: 0, x: 40 });
        gsap.set(rTxt7, { opacity: 0, x: -40 });
        gsap.timeline({ scrollTrigger: makePinST(pinR7, { scrub: 1 }) })
            .to(rFoto7, { opacity: 1, x: 0, ease: 'power2.out' }, 0)
            .to(rTxt7, { opacity: 1, x: 0, ease: 'power2.out' }, 0.15);
    }
    if (rPatri && rPopup && rPopupP) {
        rPatri.addEventListener('mouseenter', () => { rPopupP.textContent = rPatri.dataset.def; rPopup.classList.add('visible'); });
        rPatri.addEventListener('mousemove', e => { rPopup.style.left = e.clientX + 'px'; rPopup.style.top = e.clientY + 'px'; });
        rPatri.addEventListener('mouseleave', () => rPopup.classList.remove('visible'));
    }

    const pinR910 = document.getElementById('pin-res-910');
    const rp9 = document.getElementById('res-p9');
    const rp10 = document.getElementById('res-p10');
    if (pinR910 && rp9 && rp10) {
        gsap.set([rp9, rp10], { opacity: 0, yPercent: 5 });
        gsap.timeline({ scrollTrigger: makePinST(pinR910, { scrub: 1 }) })
            .to(rp9, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0.1)
            .to(rp9, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.45)
            .to(rp10, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0.55)
            .to(rp10, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.85);
    }

    const pinR1113 = document.getElementById('pin-res-1113');
    const rImgL = document.getElementById('res-img-larga');
    const caja11 = document.getElementById('res-caja-11');
    const caja12 = document.getElementById('res-caja-12');
    const caja13 = document.getElementById('res-caja-13');
    if (pinR1113 && rImgL && caja11 && caja12 && caja13) {
        gsap.set([caja11, caja12, caja13], { opacity: 0, x: -20 });
        gsap.timeline({ scrollTrigger: makePinST(pinR1113, { scrub: 1 }) })
            .to(rImgL, { y: '-40%', ease: 'none' }, 0)
            .to(caja11, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1)
            .to(caja12, { opacity: 1, x: 0, ease: 'power2.out' }, 0.45)
            .to(caja13, { opacity: 1, x: 0, ease: 'power2.out' }, 0.75);
    }

    const pinR14 = document.getElementById('pin-res-14');
    const rBox14 = document.getElementById('res-14-box');
    if (pinR14 && rBox14) {
        gsap.set(rBox14, { opacity: 0, y: 20 });
        gsap.timeline({ scrollTrigger: makePinST(pinR14, { scrub: 1 }) })
            .to(rBox14, { opacity: 1, y: 0, ease: 'power2.out' }, 0.15)
            .to(rBox14, { opacity: 0, y: -20, ease: 'power2.in' }, 0.75);
    }

    const pinR15 = document.getElementById('pin-res-15');
    const rFotoA = document.getElementById('res-15-foto-a');
    const rFotoB = document.getElementById('res-15-foto-b');
    const rFotoC = document.getElementById('res-15-foto-c');
    const rTxt15 = document.getElementById('res-15-texto');
    const rTijuana = document.getElementById('res-tijuana-final');
   
    if (pinR15 && rFotoA && rFotoB && rFotoC && rTxt15 && rTijuana) {
        gsap.set(rFotoA, { opacity: 0, x: '-30vw', y: '-10vh' });
        gsap.set(rFotoB, { opacity: 0, x: '30vw', y: '5vh' });
        gsap.set(rFotoC, { opacity: 0, x: '-20vw', y: '20vh' });
        gsap.set(rTxt15, { opacity: 0 });
        gsap.set(rTijuana, { opacity: 0 });

        gsap.timeline({ scrollTrigger: makePinST(pinR15, { scrub: 1 }) })
            .to(rFotoA, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0)
            .to(rFotoB, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0.1)
            .to(rFotoC, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0.2)
            .to(rTxt15, { opacity: 1, ease: 'power2.out' }, 0.3)
            .to([rFotoA, rFotoB, rFotoC, rTxt15], { opacity: 0, ease: 'power2.in' }, 0.68)
            .to(rTijuana, { opacity: 1, ease: 'power2.out' }, 0.8);
    }

})(); 


/* ── BACK TO TOP ────────────────────────────── */
document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


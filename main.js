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



function makePinST(wrap, extraConfig = {}) {
    return {
        trigger: wrap,
        start: 'top top',
        end: () => `+=${wrap.offsetHeight}`,  
        pin: wrap,
        pinSpacing: false,   
        ...extraConfig,
    };
}


/* ── 8.  4 AMIGOS ────────────────────── */
(function () {
   
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

    const pinWrap6 = document.getElementById('pin-amigos-6');
    if (!pinWrap6) return;

    const párrafo6 = pinWrap6.querySelector('.cap-p--fullbleed');
    if (!párrafo6) return;

    gsap.set(párrafo6, { opacity: 0, yPercent: 5 });
    gsap.timeline({ scrollTrigger: makePinST(pinWrap6, { scrub: 1 }) })
        .to(párrafo6, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0)
        .to(párrafo6, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.7);

})();


/* ── 9. ANATOMÍA ─────────────── */
(function () {
    const popup = document.getElementById('anatomia-popup');
    if (!popup) return;

    const popupTitle = popup.querySelector('.anatomia-popup-title');
    const popupDesc = popup.querySelector('.anatomia-popup-desc');

    document.querySelectorAll('.anatomia-hotspot').forEach(hotspot => {
        hotspot.addEventListener('mouseenter', () => {
            const target = hotspot.dataset.target;
            const cuadrante = hotspot.closest('.anatomia-cuadrante');

            // muestra el PNG BN del hotspot dentro de su cuadrante
            cuadrante.querySelectorAll('.anatomia-img--select').forEach(img => {
                img.classList.toggle('is-visible', img.dataset.hotspot === target);
            });

            popupTitle.textContent = hotspot.dataset.label;
            popupDesc.textContent = hotspot.dataset.desc;
            popup.classList.add('visible');
        });

        hotspot.addEventListener('mousemove', e => {
            popup.style.left = e.clientX + 'px';
            popup.style.top = e.clientY + 'px';
        });

        hotspot.addEventListener('mouseleave', () => {
            hotspot.closest('.anatomia-cuadrante')
                .querySelectorAll('.anatomia-img--select')
                .forEach(img => img.classList.remove('is-visible'));
            popup.classList.remove('visible');
        });
    });
})();


/* ── 10. CAP 2 · LA LEYENDA NEGRA ───────────── */
(function () {

    const pinIntro = document.getElementById('pin-leyenda-intro');
    const titleEl = document.getElementById('leyenda-intro-title');
    if (pinIntro && titleEl) {
        gsap.set(titleEl, { opacity: 0, yPercent: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinIntro, { scrub: 1 }) })
            .to(titleEl, { opacity: 1, yPercent: 0, ease: 'power3.out' }, 0)
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
            .to(textoL1, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6)
            // salidas
            .to([imgA, imgB, imgC], { opacity: 0, x: 40, ease: 'power2.in' }, 0.78)
            .to(textoL1, { opacity: 0, y: -20, ease: 'power2.in' }, 0.78);
    }

    const pinL2 = document.getElementById('pin-leyenda-2');
    const svgEl = document.getElementById('leyenda-svg');
    const textoL2 = document.getElementById('leyenda-texto-2');
    if (pinL2 && svgEl && textoL2) {
        gsap.set(svgEl, { scale: 0 });
        gsap.set(textoL2, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinL2, { scrub: 1 }) })
            .to(svgEl, { scale: 1, ease: 'power3.out' }, 0)
            .to(textoL2, { opacity: 1, ease: 'power2.out' }, 0.5)
            // salidas
            .to(svgEl, { scale: 0.8, opacity: 0, ease: 'power2.in' }, 0.78)
            .to(textoL2, { opacity: 0, ease: 'power2.in' }, 0.78);
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
            .to(col5, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6)
            // salida conjunta
            .to([col3, col4, col5], { opacity: 0, y: -20, ease: 'power2.in' }, 0.82);
    }
    
    const pinL6 = document.getElementById('pin-leyenda-6');
    const box6 = document.getElementById('leyenda-6-box');
    if (pinL6 && box6) {
        gsap.set(box6, { opacity: 0, y: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinL6, { scrub: 1 }) })
            .to(box6, { opacity: 1, y: 0, ease: 'power2.out' }, 0.1)
            .to(box6, { opacity: 0, y: -20, ease: 'power2.in' }, 0.75);
    }

    // bloque 7 — agrega la salida
    const pinL7 = document.getElementById('pin-leyenda-7');
    const box7 = document.getElementById('leyenda-7-box');
    const img7 = pinL7?.querySelector('.leyenda-7-img-top');
    if (pinL7 && box7 && img7) {
        gsap.set(img7, { opacity: 0 });
        gsap.set(box7, { opacity: 0, x: -40 });

        gsap.timeline({ scrollTrigger: makePinST(pinL7, { scrub: 1 }) })
            .to(img7, { opacity: 1, ease: 'power2.out' }, 0)
            .to(box7, { opacity: 1, x: 0, ease: 'power3.out' }, 0.15)
            .to(box7, { opacity: 0, x: 40, ease: 'power2.in' }, 0.65)
            .to(img7, { opacity: 0, ease: 'power2.in' }, 0.68);
    }

    const pinL8 = document.getElementById('pin-leyenda-8');
    const textoL8 = document.getElementById('leyenda-8-texto');
    if (pinL8 && textoL8) {
        const highlight = textoL8.querySelector('.leyenda-highlight');
        gsap.set(textoL8, { opacity: 0, y: 20 });
        gsap.set(highlight, { backgroundColor: 'transparent', color: 'var(--white)' });
        gsap.timeline({ scrollTrigger: makePinST(pinL8, { scrub: 1 }) })
            .to(textoL8, { opacity: 1, y: 0, ease: 'power2.out' }, 0)
            .to(highlight, { backgroundColor: 'var(--mostaza)', color: 'var(--black)', ease: 'none' }, 0.2)
            .to(textoL8, { opacity: 0, y: -20, ease: 'power2.in' }, 0.8); 
    }


    const pinFinal = document.getElementById('pin-leyenda-final');
    const finalImg = document.getElementById('leyenda-final-img');

    if (pinFinal && finalImg) {
        const sectionFinal = pinFinal.querySelector('.cap-section--leyenda-final');
        const spaceFinal = pinFinal.querySelector('.cap-scroll-space');
        const totalScrollHeight = spaceFinal?.offsetHeight || window.innerHeight * 1.5;

        gsap.set(finalImg, { opacity: 0, scale: 1.05 });

        gsap.timeline({
            scrollTrigger: {
                trigger: pinFinal,
                start: 'top top',
                end: () => `+=${totalScrollHeight}`,
                pin: sectionFinal,
                pinSpacing: false,
                scrub: 1.2,
                invalidateOnRefresh: true,
            }
        })
            .to(finalImg, { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.3 }, 0)
            .to(finalImg, { yPercent: -100, ease: 'power2.in', duration: 0.4 }, 0.6);
    }

})();


/* ── 12. DESTRUCCIÓN ─────────────────── */
(function () {

    const pinIntro = document.getElementById('pin-destruccion-intro');
    const p1 = pinIntro?.querySelector('.destruccion-p1');
    const p2 = pinIntro?.querySelector('.destruccion-p2');
    const sectionIntro = pinIntro?.querySelector('.cap-section--destruccion-intro');
    const titleBox = pinIntro?.querySelector('.cap-title-box--destruccion');
    const imgLarga = pinIntro?.querySelector('.destruccion-img-larga');

    if (pinIntro && p1 && p2 && sectionIntro) {

        gsap.set(sectionIntro, { y: '100vh' });
        gsap.set([p1, p2], { opacity: 0, y: 20 });
        gsap.set(titleBox, { clipPath: 'inset(0 0 100% 0)' });
        gsap.set(imgLarga, { clipPath: 'inset(100% 0 0 0)' });

        // entrada de la sección desde abajo
        gsap.to(sectionIntro, {
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: pinIntro,
                start: 'top bottom',
                end: 'top top',
                scrub: 1.2,
                invalidateOnRefresh: true,
            }
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: pinIntro,
                start: 'top top',
                end: () => `+=${pinIntro.offsetHeight}`,
                pin: sectionIntro,
                pinSpacing: false,
                anticipatePin: 1,
                scrub: 1,
                invalidateOnRefresh: true,
            }
        })
            // título se abre de arriba a abajo
            .to(titleBox, { clipPath: 'inset(0 0 0% 0)', ease: 'power2.out' }, 0)
            // imagen se abre de abajo a arriba
            .to(imgLarga, { clipPath: 'inset(0% 0 0 0)', ease: 'power2.out' }, 0.1)
            // párrafos entran después
            .to(p1, { opacity: 1, y: 0, ease: 'power2.out' }, 0.35)
            .to(p2, { opacity: 1, y: 0, ease: 'power2.out' }, 0.55)
            // salidas
            .to(p1, { opacity: 0, y: -20, ease: 'power2.in' }, 0.78)
            .to(p2, { opacity: 0, y: -20, ease: 'power2.in' }, 0.82);
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
            .to(dp5, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1)
            .to(dp5, { opacity: 0, x: -30, ease: 'power2.in' }, 0.8);
    }
    

    const pin6 = document.getElementById('pin-destruccion-6');
    const dp6 = document.getElementById('dest-p6');
    if (pin6 && dp6) {
        gsap.set(dp6, { opacity: 0, x: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pin6, { scrub: 1 }) })
            .to(dp6, { opacity: 1, x: 0, ease: 'power2.out' }, 0.1)
            .to(dp6, { opacity: 0, x: 30, ease: 'power2.in' }, 0.8);
    }

    /* ── Mapa destruccion ── */
    const pinMapa = document.getElementById('pin-destruccion-mapa');
    const mapaWrap = document.getElementById('destruccion-mapa-wrap');
    const puntosLayer = document.getElementById('dest-puntos-layer');
    const textoWrap = document.getElementById('dest-mapa-texto');
    const textoP = document.getElementById('dest-mapa-texto-p');

    if (pinMapa && mapaWrap) {

        const pasos = [
            {
                scale: 1.5,
                desc: "Ese mismo año el Cabildo aprobó la declaración de saturación de antros, bares, cantinas y expendios de venta de alcohol en la zona norte del primer cuadro de la ciudad, en la mera \"Revu\". La misma ciudad que llegó a ser el segundo municipio a nivel nacional con mayores ingresos por Centros Nocturnos, Bares, Cantinas y Similares."
            },
            {
                scale: 2.0,
                desc: "Con el estandarte de regular los comercios, mejorar las medidas de seguridad e higiene, llegaron las inspecciones sorpresa que llevaron a clausurar más de 60 bares en el 2025. Actualmente, para operar legalmente, el Ayuntamiento exige arcos detectores de metales en la entrada, cámaras de vigilancia (interior y exterior) y guardias de seguridad certificados."
            },
            {
                scale: 2.3,
                desc: "El pueblito no hubiera tenido oportunidad."
            },
            {
                scale: 2.5,
                desc: "No solo es la política local la que busca escapar de la leyenda negra. Con el alza del costo de vivienda al otro lado de la frontera, el sector inmobiliario encontró de nuevo a sus clientes favoritos con nuevos proyectos de condominios, oficinas y desarrollos mixtos."
            },
        ];

        const ZOOM_OUT_START = 0.65;
        const FASE2_START = 0.82;

        // Estado inicial limpio
        gsap.set(mapaWrap, { scale: 1, opacity: 1 });
        gsap.set(textoWrap, { opacity: 0 });
        gsap.set(puntosLayer, { opacity: 0 });
        puntosLayer.style.pointerEvents = 'none';
        puntosLayer.style.visibility = 'visible';

        let pasoActual = -1;
        let fase = 0;

        ScrollTrigger.create({
            ...makePinST(pinMapa),

            onEnter() {
                gsap.set(mapaWrap, { opacity: 1, scale: 1 });
                gsap.set(puntosLayer, { opacity: 0 });
                gsap.set(textoWrap, { opacity: 0 });
                puntosLayer.style.pointerEvents = 'none';
                puntosLayer.style.visibility = 'visible';
                fase = 0;
                pasoActual = -1;
            },

            onUpdate(self) {
                const p = self.progress;

                /* ── Fase 3: puntos interactivos ── */
                if (p >= FASE2_START) {
                    if (fase !== 3) {
                        fase = 3;
                        gsap.to(textoWrap, { opacity: 0, duration: 0.25 });
                        gsap.to(puntosLayer, { opacity: 1, duration: 0.5, delay: 0.2 });
                        puntosLayer.style.pointerEvents = 'all';
                    }
                    return;
                }

                /* ── Fase 2: zoom out ── */
                if (p >= ZOOM_OUT_START) {
                    if (fase !== 2) {
                        fase = 2;
                        puntosLayer.style.pointerEvents = 'none';
                        gsap.to(puntosLayer, { opacity: 0, duration: 0.2 });
                        gsap.to(textoWrap, { opacity: 0, duration: 0.3 });
                        pasoActual = -1;
                    }
                    const progZoomOut = (p - ZOOM_OUT_START) / (FASE2_START - ZOOM_OUT_START);
                    const scaleOut = gsap.utils.interpolate(2.5, 1.2, progZoomOut);
                    gsap.set(mapaWrap, { scale: scaleOut });
                    return;
                }

                if (fase !== 1) {
                    fase = 1;
                    gsap.set(mapaWrap, { opacity: 1 });
                }

                const progFase1 = p / ZOOM_OUT_START;
                const idx = Math.min(
                    Math.floor(progFase1 * pasos.length),
                    pasos.length - 1
                );
                const paso = pasos[idx];

                gsap.to(mapaWrap, {
                    scale: paso.scale,
                    duration: 0.5,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                if (idx !== pasoActual && p > 0.03) {
                    pasoActual = idx;
                    gsap.to(textoWrap, {
                        opacity: 0,
                        duration: 0.2,
                        onComplete: () => {
                            if (textoP) textoP.textContent = paso.desc;
                            gsap.to(textoWrap, { opacity: 1, duration: 0.35 });
                        }
                    });
                }
            },

            onLeaveBack() {
                gsap.to(mapaWrap, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.inOut' });
                gsap.to(textoWrap, { opacity: 0, duration: 0.3 });
                gsap.to(puntosLayer, { opacity: 0, duration: 0.3 });
                puntosLayer.style.pointerEvents = 'none';
                puntosLayer.style.visibility = 'visible'; 
                pasoActual = -1;
                fase = 0;
            },

            onLeave() {
                gsap.to(textoWrap, { opacity: 0, duration: 0.2 });
                gsap.to(puntosLayer, { opacity: 0, duration: 0.1 });
                puntosLayer.style.pointerEvents = 'none';
                fase = 0;
                pasoActual = -1;
            },
        });
    }

    const pinFotos = document.getElementById('pin-destruccion-fotos');
    const foto1 = document.getElementById('dest-foto-1');
    const foto2 = document.getElementById('dest-foto-2');
    const foto3 = document.getElementById('dest-foto-3');
    const recuadro = document.getElementById('dest-foto-recuadro');

    if (pinFotos && foto1 && foto2 && foto3) {
        const sectionFotos = pinFotos.querySelector('.cap-section--destruccion-fotos');

        gsap.set([foto1, foto2, foto3], { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(recuadro, { opacity: 0 });

        gsap.timeline({
            scrollTrigger: {
                trigger: pinFotos,
                start: 'top top',
                end: '+=350%',
                pin: sectionFotos,
                pinSpacing: true,
                scrub: 1,
                anticipatePin: 1,
            }
        })
            // foto1: entra → se va
            .to(foto1, { clipPath: 'inset(0 0% 0 0)', duration: 0.12, ease: 'power2.out' }, 0.05)
            .to(foto1, { clipPath: 'inset(0 0 0 100%)', duration: 0.10, ease: 'power2.in' }, 0.20)

            // foto2: entra → se va
            .to(foto2, { clipPath: 'inset(0 0% 0 0)', duration: 0.12, ease: 'power2.out' }, 0.28)
            .to(foto2, { clipPath: 'inset(0 0 0 100%)', duration: 0.10, ease: 'power2.in' }, 0.43)

            // foto3: entra, luego crece a pantalla completa SIN transform conflicts
            .to(foto3, { clipPath: 'inset(0 0% 0 0)', duration: 0.12, ease: 'power2.out' }, 0.50)
            .to(foto3, {
                width: '100vw',
                height: '100vh',
                top: '0',
                left: '0',
                margin: '0',
                duration: 0.14,
                ease: 'power3.inOut'
            }, 0.58)
            .to(recuadro, { opacity: 1, duration: 0.08, ease: 'power2.out' }, 0.70)
            .to(recuadro, { opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.88)
            .to(foto3, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.93);
    }

    const pinFinal = document.getElementById('pin-destruccion-final');
    const finalImgA = document.getElementById('dest-final-img-a');
    const finalImgB = document.getElementById('dest-final-img-b');
    const finalTexto = document.getElementById('dest-final-texto');
    if (pinFinal && finalImgA && finalImgB && finalTexto) {
        gsap.set(finalImgA, { opacity: 0, x: -60 });
        gsap.set(finalImgB, { opacity: 0, x: 60 });
        gsap.set(finalTexto, { opacity: 0, y: 30 });
        gsap.timeline({ scrollTrigger: makePinST(pinFinal, { scrub: 1 }) })
            .to(finalImgA, { opacity: 1, x: 0, ease: 'power3.out' }, 0)
            .to(finalImgB, { opacity: 1, x: 0, ease: 'power3.out' }, 0.1)
            .to(finalTexto, { opacity: 1, y: 0, ease: 'power2.out' }, 0.3)
            .to([finalImgA, finalImgB, finalTexto], { opacity: 0, ease: 'power2.in' }, 0.75);
    }
    

})();


/* ── 13. RESISTENCIA ────────────────── */
(function () {

    const pinR1 = document.getElementById('pin-res-1');
    const rp1 = document.getElementById('res-p1');
    const titulo1 = document.getElementById('res-1-titulo');

    if (pinR1 && rp1) {
        gsap.set(rp1, { opacity: 0, yPercent: 5 });
        if (titulo1) gsap.set(titulo1, { opacity: 0, y: 20 });

        gsap.timeline({ scrollTrigger: makePinST(pinR1, { scrub: 1 }) })
            // 1. título entra
            .to(titulo1, { opacity: 1, y: 0, ease: 'power3.out' }, 0)
            // 2. título se queda un momento
            // 3. título sale
            .to(titulo1, { opacity: 0, y: -20, ease: 'power2.in' }, 0.3)
            // 4. párrafo entra después de que el título salió
            .to(rp1, { opacity: 1, yPercent: 0, ease: 'power2.out' }, 0.45)
            // 5. párrafo sale al final
            .to(rp1, { opacity: 0, yPercent: -5, ease: 'power2.in' }, 0.78);
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
            .to(rp4, { opacity: 1, y: 0, ease: 'power2.out' }, 0.6)
            .to(rp2, { opacity: 0, x: -30, ease: 'power2.in' }, 0.78)
            .to(rp3, { opacity: 0, x: 30, ease: 'power2.in' }, 0.78)
            .to(rp4, { opacity: 0, y: -20, ease: 'power2.in' }, 0.82);
    }

    const pinR5 = document.getElementById('pin-res-5');
    const rRec5 = document.getElementById('res-5-recuadro');
    if (pinR5 && rRec5) {
        gsap.set(rRec5, { opacity: 0, y: 20 });
        gsap.timeline({ scrollTrigger: makePinST(pinR5, { scrub: 1 }) })
            .to(rRec5, { opacity: 1, y: 0, ease: 'power2.out' }, 0.2)
            .to(rRec5, { opacity: 0, y: -20, ease: 'power2.in' }, 0.8);
    }

    const pinR6 = document.getElementById('pin-res-6');
    const rSvg = document.getElementById('res-svg');
    const rp6 = document.getElementById('res-p6');
    if (pinR6 && rSvg && rp6) {
        gsap.set(rSvg, { scale: 0 });
        gsap.set(rp6, { opacity: 0 });
        gsap.timeline({ scrollTrigger: makePinST(pinR6, { scrub: 1 }) })
            .to(rSvg, { scale: 1, ease: 'power3.out' }, 0)
            .to(rp6, { opacity: 1, ease: 'power2.out' }, 0.5)
            .to(rSvg, { scale: 0.8, opacity: 0, ease: 'power2.in' }, 0.78)
            .to(rp6, { opacity: 0, ease: 'power2.in' }, 0.78);
    }

    gsap.to('#pow-shape', {
        rotation: 8,
        yoyo: true,
        repeat: -1,
        duration: 2.5,
        ease: 'sine.inOut',
        transformOrigin: '50% 50%'
    });

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
            .to(rTxt7, { opacity: 1, x: 0, ease: 'power2.out' }, 0.15)
            .to(rFoto7, { opacity: 0, x: 40, ease: 'power2.in' }, 0.78)
            .to(rTxt7, { opacity: 0, x: -40, ease: 'power2.in' }, 0.78);
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

        gsap.set([caja11, caja12, caja13], { opacity: 0, x: -30 });

        gsap.timeline({ scrollTrigger: makePinST(pinR1113, { scrub: 1.5 }) })
            .to(rImgL, { y: '-2%', ease: 'none' }, 0)

            .to(caja11, { opacity: 1, x: 0, ease: 'power2.out' }, 0.15)
            .to(caja11, { opacity: 0, x: -30, ease: 'power2.in' }, 0.80)

            .to(caja12, { opacity: 1, x: 0, ease: 'power2.out' }, 0.38)
            .to(caja12, { opacity: 0, x: -30, ease: 'power2.in' }, 0.90)

            .to(caja13, { opacity: 1, x: 0, ease: 'power2.out' }, 0.90)
            .to(caja13, { opacity: 0, x: -30, ease: 'power2.in' }, 1.30)

            .to(rImgL, { y: '-50%', ease: 'none' }, 0.82)
            .to({}, { duration: 0.18 });   
    }

    const pinR14 = document.getElementById('pin-res-14');
    const rBox14 = document.getElementById('res-14-box');
    if (pinR14 && rBox14) {
        gsap.set(rBox14, { opacity: 0, y: 60, scale: 0.96 });

        const section14 = pinR14.querySelector('.cap-section--res-14');
        const space14 = pinR14.querySelector('.cap-scroll-space');
        const totalHeight = (section14?.offsetHeight || window.innerHeight)
            + (space14?.offsetHeight || 0);

        gsap.timeline({
            scrollTrigger: {
                trigger: pinR14,
                start: 'top top',
                end: () => `+=${totalHeight}`,
                pin: section14,
                pinSpacing: false,
                anticipatePin: 1,          
                scrub: 1,
                invalidateOnRefresh: true,
            }
        })
            .to(rBox14, { opacity: 1, y: 0, scale: 1, ease: 'power3.out' }, 0.15)
            .to(rBox14, { opacity: 0, y: -40, ease: 'power2.in' }, 0.75);
    }

    const pinR15 = document.getElementById('pin-res-15');
    const rFotoA = document.getElementById('res-15-foto-a');
    const rFotoB = document.getElementById('res-15-foto-b');
    const rFotoC = document.getElementById('res-15-foto-c');
    const rTxt15 = document.getElementById('res-15-texto');
    const rTijuana = document.getElementById('res-tijuana-final');

    if (pinR15 && rFotoA && rFotoB && rFotoC && rTxt15 && rTijuana) {

        const section15 = pinR15.querySelector('.cap-section--res-15');
        const space15 = pinR15.querySelector('.cap-scroll-space');
        const totalHeight = (section15?.offsetHeight || window.innerHeight)
            + (space15?.offsetHeight || 0);

        gsap.set(rFotoA, { opacity: 0, x: '-30vw', y: '-10vh' });
        gsap.set(rFotoB, { opacity: 0, x: '30vw', y: '5vh' });
        gsap.set(rFotoC, { opacity: 0, x: '-20vw', y: '20vh' });
        gsap.set(rTxt15, { opacity: 0, y: 30 });
        gsap.set(rTijuana, { opacity: 0, scale: 0.85 });

        gsap.timeline({
            scrollTrigger: {
                trigger: pinR15,
                start: 'top top',
                end: () => `+=${totalHeight}`,
                pin: section15,
                pinSpacing: false,
                anticipatePin: 1,
                scrub: 1,
                invalidateOnRefresh: true,
                
                onLeave() {
                    gsap.set(section15, { clearProps: 'all' });
                    section15.style.display = 'none';
                },
                onEnterBack() {
                    section15.style.display = '';
                    gsap.set(rTijuana, { opacity: 0, scale: 0.85 });
                },
            }
        })
            .to(rFotoA, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0)
            .to(rFotoB, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0.1)
            .to(rFotoC, { opacity: 1, x: 0, y: 0, ease: 'power3.out' }, 0.2)
            .to(rTxt15, { opacity: 1, y: 0, ease: 'power2.out' }, 0.3)
            // fotos y texto salen
            .to([rFotoA, rFotoB, rFotoC], { opacity: 0, ease: 'power2.in' }, 0.62)
            .to(rTxt15, { opacity: 0, y: -20, ease: 'power2.in' }, 0.62)

            .to(rTijuana, { opacity: 1, scale: 1, ease: 'power2.out' }, 0.72)
            .to(rTijuana, { opacity: 0, ease: 'power2.in' }, 0.92);
    }

})(); 

/* ── BACK TO TOP ────────────────────────────── */
document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 300);
});


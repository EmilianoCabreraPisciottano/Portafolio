document.documentElement.classList.add('js');

const backToTop = document.getElementById('back-to-top');
const scrollProgress = document.querySelector('.scroll-progress span');
const revealItems = document.querySelectorAll('.reveal-on-scroll');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');
const statNumbers = document.querySelectorAll('.stat-number');
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const navToggle = document.getElementById('nav-toggle');
const navShell = document.querySelector('.nav-shell');

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach(item => revealObserver.observe(item));

// Map known technology names to short initials for decorative icons
const techMap = [
  ['javascript', 'JS'],
  ['typescript', 'TS'],
  ['react', 'RE'],
  ['spring boot', 'SB'],
  ['spring', 'SB'],
  ['java', 'J'],
  ['node', 'ND'],
  ['express', 'EX'],
  ['bootstrap', 'B'],
  ['html', 'H'],
  ['css', 'C'],
  ['nodemailer', 'N'],
  ['jpa', 'JP'],
];

// Map technology keys to SVG symbol IDs in the centralized sprite
const iconMap = {
  'javascript': 'icon-javascript',
  'typescript': 'icon-typescript',
  'react': 'icon-react',
  'node': 'icon-node',
  'java': 'icon-java',
  'spring': 'icon-spring',
};

function applyTechInitials() {
  const sets = [
    ...document.querySelectorAll('.project-tags span'),
    ...document.querySelectorAll('.tech-list li'),
    ...document.querySelectorAll('.skills-pills span'),
    ...document.querySelectorAll('.profile-tags span')
  ];

  sets.forEach(el => {
    const text = (el.textContent || '').toLowerCase();
    let found = false;
    for (const [key, initial] of techMap) {
      if (text.includes(key)) {
        el.setAttribute('data-tech', key.replace(/\s+/g, '-'));
        el.setAttribute('data-initial', initial);
        // insert icon if available (use sprite <use> for better reuse)
        const iconId = iconMap[key];
        if (iconId) {
          const original = el.textContent.trim();
          el.classList.add('has-icon');
          // prefer external sprite for reuse; fallback to internal symbol if needed
          const spriteHref = `icons.svg#${iconId}`;
          // make the icon accessible: provide role and aria-label, and make it focusable for keyboard users
          el.innerHTML = `<span class="tech-icon" role="img" aria-label="${original}" tabindex="0" title="${original}"><svg aria-hidden="true" focusable="false"><use href="${spriteHref}" xlink:href="${spriteHref}"></use></svg></span><span class="tech-text">${original}</span>`;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      // default initial: first 2 letters uppercase
      const initials = (el.textContent || '').trim().slice(0,2).toUpperCase();
      el.setAttribute('data-initial', initials || '•');
    }
  });
}

applyTechInitials();

// Setup interactions for icons: toggle visible text on click/tap and keyboard
function setupIconInteractions() {
  const parents = document.querySelectorAll('.project-tags span.has-icon, .skills-pills span.has-icon, .tech-list li.has-icon, .profile-tags span.has-icon');
  // store active timers per element so they can be cleared if user re-toggles
  const timers = new WeakMap();
  const AUTO_CLOSE_MS = 3000;

  function clearTimerFor(el) {
    const t = timers.get(el);
    if (t) {
      clearTimeout(t);
      timers.delete(el);
    }
  }

  parents.forEach(el => {
    const icon = el.querySelector('.tech-icon');
    if (!icon) return;

    const openLabel = () => {
      el.classList.add('show-text');
      clearTimerFor(el);
      const id = setTimeout(() => el.classList.remove('show-text'), AUTO_CLOSE_MS);
      timers.set(el, id);
    };

    const closeLabel = () => {
      el.classList.remove('show-text');
      clearTimerFor(el);
    };

    // Click / touch toggles the label for small screens
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.classList.contains('show-text')) closeLabel();
      else openLabel();
    });

    // Keyboard activation (Enter / Space)
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (el.classList.contains('show-text')) closeLabel();
        else openLabel();
      }
    });

    // If user manually removes via other interactions, ensure timer is cleared
    el.addEventListener('remove-show-text', () => clearTimerFor(el));
  });

  // Close any open labels when clicking outside; also clear timers
  document.addEventListener('click', (ev) => {
    parents.forEach(p => {
      if (!p.contains(ev.target)) {
        p.classList.remove('show-text');
        clearTimerFor(p);
      }
    });
  });
}

setupIconInteractions();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animateCount = el => {
  const target = Number(el.dataset.target || 0);
  if (prefersReducedMotion) {
    el.textContent = String(target);
    return;
  }

  const duration = 1100;
  const start = performance.now();

  const step = now => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = String(Math.floor(progress * target));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = String(target);
    }
  };

  requestAnimationFrame(step);
};

const statObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

statNumbers.forEach(stat => statObserver.observe(stat));

statNumbers.forEach(stat => {
  const rect = stat.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    animateCount(stat);
    statObserver.unobserve(stat);
  }
});

const setActiveSection = () => {
  const scrollPos = window.scrollY + 160;

  sections.forEach(section => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (scrollPos >= top && scrollPos < bottom) {
      const id = section.getAttribute('id');
      navLinks.forEach(link => {
        const isMatch = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isMatch);
      });
    }
  });
};

const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  if (scrollProgress) {
    scrollProgress.style.width = `${Math.min(progress, 100)}%`;
  }
};

const applyProjectFilter = filter => {
  projectCards.forEach(card => {
    const matches = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !matches);
  });

  filterButtons.forEach(button => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(!!isActive));
  });
};

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 380);
  setActiveSection();
  updateScrollProgress();
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    applyProjectFilter(button.dataset.filter || 'all');
  });
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      applyProjectFilter(button.dataset.filter || 'all');
      button.focus();
    }
  });
});

if (navToggle && navShell) {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.addEventListener('click', (e) => {
    const isOpen = navShell.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(!!isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navShell.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && navShell.classList.contains('open')) {
      navShell.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close when clicking outside nav-shell
  document.addEventListener('click', (ev) => {
    if (!navShell.classList.contains('open')) return;
    const target = ev.target;
    if (!navShell.contains(target) && target !== navToggle) {
      navShell.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const rotateY = ((x - 50) / 50) * 5;
      const rotateX = ((50 - y) / 50) * 4;

      card.style.setProperty('--x', `${x}%`);
      card.style.setProperty('--y', `${y}%`);
      card.style.transform = `perspective(850px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(850px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

setActiveSection();
updateScrollProgress();
applyProjectFilter('all');

// Contact form handling (client-side validation + simulated send)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const feedback = document.getElementById('contact-feedback');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.textContent = '';

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !email || !message) {
      feedback.textContent = 'Por favor completá todos los campos.';
      feedback.className = 'contact-feedback error';
      return;
    }
    if (!emailOk) {
      feedback.textContent = 'Ingresá un email válido.';
      feedback.className = 'contact-feedback error';
      return;
    }

    feedback.textContent = 'Enviando...';
    feedback.className = 'contact-feedback';

    // Simulate network send
    setTimeout(() => {
      feedback.textContent = 'Mensaje enviado. Gracias — te respondo pronto.';
      feedback.className = 'contact-feedback success';
      contactForm.reset();
    }, 900);
  });
}

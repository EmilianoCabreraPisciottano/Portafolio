document.documentElement.classList.add('js');

const backToTop = document.getElementById('back-to-top');
const revealItems = document.querySelectorAll('.reveal-on-scroll');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');
const statNumbers = document.querySelectorAll('.stat-number');

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

const animateCount = el => {
  const target = Number(el.dataset.target || 0);
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

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 380);
  setActiveSection();
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

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

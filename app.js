/* app.js — drop-in interactivity for your portfolio */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const navLinks = document.querySelectorAll('.navbar a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const heroContent = document.querySelector('#hero .hero-content');
  const cards = document.querySelectorAll('.work-card, .skill-item, .contact-item, .social-link, .section-title, .profile-section');
  const emailLink = document.querySelector('.email-icon');

  /* 1) Shrink header on scroll */
  const onScrollHeader = () => {
    if (window.scrollY > 10) header.classList.add('shrink');
    else header.classList.remove('shrink');
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* 2) Smooth scroll with fixed-header offset */
  const headerHeight = () => (document.querySelector('header')?.offsetHeight || 0);
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight() + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* 3) Active nav link highlight based on scroll */
  const setActiveNav = () => {
    const scrollPos = window.scrollY + headerHeight() + 20;
    let currentId = sections[0]?.id;
    for (const sec of sections) {
      const top = sec.offsetTop;
      if (scrollPos >= top) currentId = sec.id;
    }
    navLinks.forEach(a => {
      const isActive = a.getAttribute('href') === `#${currentId}`;
      a.classList.toggle('active', isActive);
    });
  };
  setActiveNav();
  window.addEventListener('scroll', setActiveNav, { passive: true });

  /* 4) Scroll reveal animations (IntersectionObserver) */
  const toReveal = Array.from(cards).filter(Boolean);

  // Only add default .reveal if no other reveal class is present
  toReveal.forEach(el => {
    if (!el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
      el.classList.add('reveal');
    }
  });

  const allReveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  allReveals.forEach(el => io.observe(el));

  /* 5) Simple parallax effect */
  const onParallax = () => {
    if (!heroContent) return;
    const scrolled = window.scrollY;
    const opacity = 1 - scrolled / (window.innerHeight * 0.6);

    heroContent.style.opacity = Math.max(0, opacity);
  };

  onParallax();
  window.addEventListener('scroll', onParallax, { passive: true });

  /* 5.1) Mouse Parallax for Shapes */
  const heroSection = document.querySelector('#hero');
  const shapes = document.querySelectorAll('.shape');

  if (heroSection && shapes.length > 0) {
    heroSection.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.05; // Different speed for depth
        const x = (clientX - centerX) * speed;
        const y = (clientY - centerY) * speed;

        shape.style.setProperty('--px', `${x}px`);
        shape.style.setProperty('--py', `${y}px`);
      });
    });
  }

  /* 6) Enhanced 3D hover effects on work cards */
  document.querySelectorAll('.work-card').forEach((card, index) => {
    let raf = null;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -10; // Max 10deg rotation
      const rotateY = (x - centerX) / centerX * 10;

      if (raf) cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        card.style.transform = `
          translateY(-8px) 
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          scale(1.02)
        `;
      });
    };

    const handleMouseEnter = () => {
      card.style.transition = 'transform 0.1s ease-out';
    };

    const handleMouseLeave = () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
      card.style.transform = '';
      if (raf) cancelAnimationFrame(raf);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    // Add staggered initial animation
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('reveal');
  });

  /* 7) Scroll progress bar */
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);
  const updateBar = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = pct + '%';
  };
  updateBar();
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);

  /* 8) Simple email copy functionality */
  if (emailLink) {
    emailLink.addEventListener('click', async (e) => {
      const email = emailLink.href.replace('mailto:', '');
      if (!email) return;
      e.preventDefault();

      try {
        await navigator.clipboard.writeText(email);
        showToast('メールアドレスをコピーしました');
      } catch {
        window.location.href = emailLink.href;
      }
    });
  }

  function showToast(msg) {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);

    requestAnimationFrame(() => t.classList.add('show'));

    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 1500);
  }

  /* 9) Optional: simple category filter (works with future cards)
         Add classes like: .dify-project, .streamlit-project, .midjourney-project, .suno-project to .work-card
  */
  const worksContainer = document.querySelector('#sectionWorks .container');
  const grid = document.querySelector('.works-grid');
  if (worksContainer && grid) {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.innerHTML = `
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="dify-project">Dify</button>
      <button class="filter-btn" data-filter="streamlit-project">Streamlit</button>
      <button class="filter-btn" data-filter="midjourney-project">Midjourney</button>
      <button class="filter-btn" data-filter="suno-project">Suno</button>
      <button class="filter-btn" data-filter="gas-project">GAS</button>
    `;
    worksContainer.insertBefore(bar, grid);
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      const key = btn.dataset.filter;
      document.querySelectorAll('.works-grid .work-card').forEach(card => {
        const show = key === 'all' || card.classList.contains(key);
        card.classList.toggle('hidden', !show);
      });
    });
  }

  /* Respect reduce motion */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.querySelectorAll('.reveal, .work-card').forEach(el => {
      el.style.transition = 'none';
      el.classList.add('is-visible');
    });
  }
  /* 10) Mobile Menu Logic */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
      hamburger.setAttribute('aria-expanded', !expanded);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  /* 11) Custom Cursor Logic */
  const cursorDot = document.querySelector('[data-cursor-dot]');
  const cursorOutline = document.querySelector('[data-cursor-outline]');

  if (cursorDot && cursorOutline && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      const posX = e.clientX;
      const posY = e.clientY;

      // Dot follows immediately
      cursorDot.style.left = `${posX}px`;
      cursorDot.style.top = `${posY}px`;

      // Outline follows with slight delay (animation handled by CSS transition)
      cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
      }, { duration: 500, fill: "forwards" });
    });

    // Add visual feedback for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .work-card, input, textarea');

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
  }
});

/**
 * ReSave v2 Mock - Navigation Script
 * モック画面間のナビゲーションを制御
 */

document.addEventListener('DOMContentLoaded', () => {
  const contentFrame = document.getElementById('content-frame');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const menuBtn = document.getElementById('menu-btn');

  // Page mapping
  const pages = {
    main: 'main.html',
    completed: 'completed.html',
    tags: 'tags.html',
    settings: 'settings.html',
    about: 'about.html',
    'card-input': 'card-input.html',
  };

  // Navigation handlers
  function navigateTo(page) {
    if (pages[page] && contentFrame) {
      contentFrame.src = pages[page];
      updateActiveNav(page);
      closeSidebar();
    }
  }

  function updateActiveNav(activePage) {
    // Update sidebar links
    document.querySelectorAll('.sidebar__link[data-page]').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === activePage);
    });

    // Update bottom nav links
    document.querySelectorAll('.bottom-nav__item[data-page]').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === activePage);
    });
  }

  // Sidebar toggle (mobile)
  function toggleSidebar() {
    sidebar?.classList.toggle('mobile-open');
    sidebarOverlay?.classList.toggle('active');
  }

  function closeSidebar() {
    sidebar?.classList.remove('mobile-open');
    sidebarOverlay?.classList.remove('active');
  }

  // Event listeners
  menuBtn?.addEventListener('click', toggleSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);

  // Sidebar navigation
  document.querySelectorAll('.sidebar__link[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });

  // Bottom navigation
  document.querySelectorAll('.bottom-nav__item[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });

  // Study card toggle (for main.html iframe)
  if (contentFrame) {
    contentFrame.addEventListener('load', () => {
      try {
        const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow?.document;
        if (iframeDoc) {
          // Add click handlers for study card toggles
          iframeDoc.querySelectorAll('.study-card__toggle').forEach((toggle) => {
            toggle.addEventListener('click', () => {
              const card = toggle.closest('.study-card');
              if (card) {
                card.classList.toggle('open');
                const label = toggle.querySelector('span:last-child');
                const isOpen = card.classList.contains('open');
                if (label) {
                  label.textContent = isOpen ? '答えを隠す' : '答えを見る';
                }
                // Toggle icon
                const icons = toggle.querySelectorAll('svg');
                icons.forEach((icon, index) => {
                  icon.style.display = (index === 0 && !isOpen) || (index === 1 && isOpen) ? 'block' : 'none';
                });
              }
            });
          });

          // Tab switching
          iframeDoc.querySelectorAll('.tab[data-tab]').forEach((tab) => {
            tab.addEventListener('click', () => {
              // Remove active from all tabs
              iframeDoc.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
              // Add active to clicked tab
              tab.classList.add('active');
            });
          });

          // Period tabs (stats page)
          iframeDoc.querySelectorAll('.period-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
              iframeDoc.querySelectorAll('.period-tab').forEach((t) => t.classList.remove('active'));
              tab.classList.add('active');
            });
          });

          // Toggle switches
          iframeDoc.querySelectorAll('.toggle').forEach((toggle) => {
            toggle.addEventListener('click', () => {
              toggle.classList.toggle('active');
            });
          });

          // FAB - open create sheet
          const fabBtn = iframeDoc.getElementById('fab-btn');
          const fabOverlay = iframeDoc.getElementById('fab-overlay');
          const createSheet = iframeDoc.getElementById('create-sheet');
          const sheetCloseBtn = iframeDoc.getElementById('sheet-close-btn');
          const sheetCancelBtn = iframeDoc.getElementById('sheet-cancel-btn');

          function openCreateSheet() {
            createSheet?.classList.add('open');
            fabOverlay?.classList.add('active');
          }

          function closeCreateSheet() {
            createSheet?.classList.remove('open');
            fabOverlay?.classList.remove('active');
          }

          fabBtn?.addEventListener('click', openCreateSheet);
          fabOverlay?.addEventListener('click', closeCreateSheet);
          sheetCloseBtn?.addEventListener('click', closeCreateSheet);
          sheetCancelBtn?.addEventListener('click', closeCreateSheet);
        }
      } catch (e) {
        // Cross-origin iframe access may fail, which is expected
      }
    });
  }
});

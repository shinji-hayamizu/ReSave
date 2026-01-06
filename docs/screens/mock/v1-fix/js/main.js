/**
 * ReSave - Main JavaScript
 * Handles navigation, sidebar, tabs, and card interactions
 */

// ========================================
// Page Navigation (for iframe)
// ========================================

/**
 * Load a page into the content frame
 * @param {string} url - The URL to load
 */
function loadPage(url) {
  const frame = document.getElementById('content-frame');
  if (frame) {
    frame.src = url;

    // Update active state in sidebar
    updateNavActiveState(url);
  }
}

/**
 * Update active state in sidebar navigation
 * @param {string} url - The current URL
 */
function updateNavActiveState(url) {
  const sidebarLinks = document.querySelectorAll('.sidebar__link');

  // Remove all active states
  sidebarLinks.forEach(link => link.classList.remove('active'));

  // Find and activate matching link
  const pageName = url.replace('.html', '');

  sidebarLinks.forEach(link => {
    const linkPage = link.getAttribute('data-page');
    if (linkPage === pageName) {
      link.classList.add('active');
    }
  });
}

// ========================================
// Mobile Sidebar
// ========================================

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar && overlay) {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
  }
}

/**
 * Close mobile sidebar
 */
function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar && overlay) {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  }
}

// ========================================
// Initialize (for index.html)
// ========================================

function initializeApp() {
  // Mobile menu button
  const menuBtn = document.querySelector('.header__menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileSidebar);
  }

  // Sidebar overlay click to close
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Sidebar link clicks
  const sidebarLinks = document.querySelectorAll('.sidebar__link[data-page]');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      loadPage(page + '.html');
      closeMobileSidebar();
    });
  });

}

// ========================================
// Content Page Functions (for main.html etc)
// ========================================

/**
 * Initialize tabs
 */
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content visibility
      tabContents.forEach(content => {
        if (content.id === targetId) {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  });
}


/**
 * Initialize study cards (answer toggle)
 */
function initializeStudyCards() {
  const cards = document.querySelectorAll('.study-card');

  cards.forEach(card => {
    const toggleBtn = card.querySelector('.study-card__toggle');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        card.classList.toggle('open');

        // Update button text
        const isOpen = card.classList.contains('open');
        const btnText = toggleBtn.querySelector('span');
        if (btnText) {
          btnText.textContent = isOpen ? 'Hide Answer' : 'Show Answer';
        }
      });
    }

    // Rating buttons
    const ratingBtns = card.querySelectorAll('.rating-btn');
    ratingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.getAttribute('data-rating');
        handleRating(card, rating);
      });
    });
  });
}

/**
 * Handle rating button click
 * @param {HTMLElement} card - The card element
 * @param {string} rating - The rating value (ok, learned, again)
 */
function handleRating(card, rating) {
  // Add visual feedback
  card.style.opacity = '0.5';
  card.style.transform = 'scale(0.98)';

  // Simulate processing (in real app, this would update the database)
  setTimeout(() => {
    // For demo: hide the card or show feedback
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(100px)';

    setTimeout(() => {
      // In real app: remove card and show next, or update list
      card.style.display = 'none';

      // Check if there are more cards
      const visibleCards = document.querySelectorAll('.study-card:not([style*="display: none"])');
      if (visibleCards.length === 0) {
        showCompletionMessage();
      }
    }, 300);
  }, 200);
}

/**
 * Show completion message when all cards are done
 */
function showCompletionMessage() {
  const cardList = document.querySelector('.card-list');
  if (cardList) {
    cardList.innerHTML = `
      <div class="card-list__empty">
        <svg class="card-list__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>Great job! You've completed all cards in this tab.</p>
      </div>
    `;
  }
}

/**
 * Initialize quick input form
 */
function initializeQuickInputForm() {
  const form = document.querySelector('.quick-input__form');
  const textInput = document.getElementById('quick-text');
  const saveBtn = document.querySelector('.quick-input__save');

  if (textInput && saveBtn) {
    // Enable/disable save button based on input
    textInput.addEventListener('input', () => {
      saveBtn.disabled = textInput.value.trim() === '';
    });

    // Handle save
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = textInput.value.trim();
        const hiddenText = document.getElementById('quick-hidden')?.value.trim() || '';

        if (text) {
          // In real app: save to database
          alert(`Card saved!\nText: ${text}\nHidden: ${hiddenText || '(none)'}`);

          // Clear form
          textInput.value = '';
          if (document.getElementById('quick-hidden')) {
            document.getElementById('quick-hidden').value = '';
          }
          saveBtn.disabled = true;
        }
      });
    }
  }
}

/**
 * Initialize content page
 */
function initializeContentPage() {
  initializeTabs();
  initializeStudyCards();
  initializeQuickInputForm();
}

// ========================================
// Auto-initialize based on page type
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if this is the main shell (index.html)
  if (document.getElementById('content-frame')) {
    initializeApp();
  }

  // Check if this is a content page
  if (document.querySelector('.content-wrapper')) {
    initializeContentPage();
  }
});

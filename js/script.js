
/* Constants */
const DEFAULT_IMAGE_SIZE = 800;

/* Class to manage modal viewer */
class ModalViewer {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.modalImage = this.modal.querySelector('#modal-image');
    this.modalTitle = this.modal.querySelector('#modal-title');
    this.closeBtn = this.modal.querySelector('#modal-close');
    this._bindEvents();
  }

  _bindEvents() {

    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.hasAttribute('hidden')) this.close();
    });

  }

  open(imgSrc, titleText) {

    this.modalImage.src = imgSrc;
    this.modalTitle.textContent = titleText || '';
    this.modal.hidden = false;
    this.modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

  }

  close() {
   
    this.modal.hidden = true;
    this.modal.setAttribute('aria-hidden', 'true');
    this.modalImage.src = '';
    this.modalTitle.textContent = '';
    document.body.style.overflow = '';

  }
}

/* DOM ready */
document.addEventListener('DOMContentLoaded', function () {
  // header elements
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');
  const searchBtn = document.getElementById('search-btn');
  const searchBar = document.getElementById('search-bar');
  const yearEl = document.getElementById('year');


  // set year
  const currentYear = new Date().getFullYear();
  yearEl.textContent = currentYear;

  // mobile menu toggle
  hamburger.addEventListener('click', function () {
    const isOpen = mainNav.style.display === 'block';
    mainNav.style.display = isOpen ? 'none' : 'block';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
  });

  // search toggle
  searchBtn.addEventListener('click', function () {
    const isHidden = searchBar.hasAttribute('hidden');
    if (isHidden) {
      searchBar.removeAttribute('hidden');
    } else {
      searchBar.setAttribute('hidden', '');
    }
  });

  // gallery modal behavior
  const galleryGrid = document.getElementById('gallery-grid');
  const modalViewer = new ModalViewer('image-modal');

  // delegation: open modal when clicking item or pressing Enter
  galleryGrid.addEventListener('click', function (e) {
    let item = e.target.closest('.gallery-item');
    if (!item) return;
    const src = item.getAttribute('data-src') || item.querySelector('img').src;
    const title = item.getAttribute('data-title') || '';
    modalViewer.open(src, title);
  });

  // keyboard accessibility: open on Enter
  galleryGrid.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      let item = e.target.closest('.gallery-item');
      if (!item) return;
      const src = item.getAttribute('data-src') || item.querySelector('img').src;
      const title = item.getAttribute('data-title') || '';
      modalViewer.open(src, title);
    }
  });

  // simple search filter (client-side)
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', function (e) {
    const q = e.target.value.trim().toLowerCase();
    const items = galleryGrid.querySelectorAll('.gallery-item');
    items.forEach(item => {
      const title = (item.getAttribute('data-title') || '').toLowerCase();
      const author = (item.querySelector('.gallery-meta p')?.textContent || '').toLowerCase();
      const match = title.includes(q) || author.includes(q);
      item.style.display = match || q === '' ? '' : 'none';
    });
  });
});


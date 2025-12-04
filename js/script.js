/* script.js
   - JS class names in PascalCase
   - variables and functions in camelCase
   - constants in UPPER_SNAKE
*/

/* Constants */
const STORAGE_KEY = 'mangahub_collection_v1';

/* Simple utility to create DOM elements (elements = El */
function createElement(tag, props = {}, children = []) {
  const El = document.createElement(tag);
  Object.keys(props).forEach(k => {
    if (k === 'class') El.className = props[k];
    else if (k === 'dataset') {
      Object.entries(props[k]).forEach(([dKey, dVal]) => El.dataset[dKey] = dVal);
    } else El.setAttribute(k, props[k]);
  });
  children.forEach(ch => {
    if (typeof ch === 'string') El.appendChild(document.createTextNode(ch));
    else El.appendChild(ch);
  });
  return El;
}

/* Class to manage storage (CRUD persistence) */
class StoreManager {
  static loadAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse storage JSON', err);
      return [];
    }
  }

  static saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  static add(item) {
    const list = StoreManager.loadAll();
    list.unshift(item); // add to top
    StoreManager.saveAll(list);
  }

  static update(id, newItem) {
    const list = StoreManager.loadAll();
    const index = list.findIndex(i => i.id === id);
    if (index >= 0) {
      list[index] = newItem;
      StoreManager.saveAll(list);
    }
  }

  static remove(id) {
    let list = StoreManager.loadAll();
    list = list.filter(i => i.id !== id);
    StoreManager.saveAll(list);
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* App class: handles UI and form validation */
class App {
  constructor() {
    // DOM refs
    this.form = document.getElementById('manga-form');
    this.inputTitle = document.getElementById('input-title');
    this.inputAuthor = document.getElementById('input-author');
    this.selectGenre = document.getElementById('select-genre');
    this.inputYear = document.getElementById('input-year');
    this.inputCover = document.getElementById('input-cover');
    this.formErrors = document.getElementById('form-errors');
    this.formTitle = document.getElementById('form-title');
    this.formSubmit = document.getElementById('form-submit');
    this.formCancel = document.getElementById('form-cancel');

    this.listEl = document.getElementById('manga-list');
    this.clearStorageBtn = document.getElementById('clear-storage');

    // editing state
    this.editingId = null;

    this._bindEvents();
    this.renderList();
    this._initHeaderUI(); // existing header behaviours (year, search, menu)
  }

  _bindEvents() {
    this.form.addEventListener('submit', (E) => {
      E.preventDefault();
      this.handleSubmit();
    });
    this.formCancel.addEventListener('click', () => this.resetForm());
    this.clearStorageBtn.addEventListener('click', () => {
      if (confirm('¿Borrar toda la colección?')) {
        StoreManager.clear();
        this.renderList();
      }
    });
  }

  /* Validate form fields using JS only */
  validateForm() {
    const errors = [];
    const title = this.inputTitle.value.trim();
    const author = this.inputAuthor.value.trim();
    const genre = this.selectGenre.value;
    const yearVal = this.inputYear.value.trim();
    const cover = this.inputCover.value.trim();

    if (!title) errors.push('El título es obligatorio.');
    if (!author) errors.push('El autor es obligatorio.');
    if (!genre) errors.push('Selecciona un género.');
    if (!yearVal) errors.push('El año es obligatorio.');
    else {
      const year = Number(yearVal);
      if (Number.isNaN(year) || year < 1900 || year > 2030) errors.push('El año debe estar entre 1900 y 2030.');
    }
    if (cover) {
      // Basic URL pattern test
      try {
        const url = new URL(cover);
        // Accept only http/https
        if (!['http:', 'https:'].includes(url.protocol)) errors.push('La URL de la portada debe usar http o https.');
      } catch (err) {
        errors.push('La URL de la portada no es válida.');
      }
    }

    return errors;
  }

  /* Handle create / update */
  handleSubmit() {
    const errors = this.validateForm();
    this.formErrors.innerHTML = '';
    if (errors.length) {
      errors.forEach(msg => {
        const li = createElement('li', {}, [msg]);
        this.formErrors.appendChild(li);
      });
      return;
    }

    const item = {
      id: this.editingId || String(Date.now()),
      title: this.inputTitle.value.trim(),
      author: this.inputAuthor.value.trim(),
      genre: this.selectGenre.value,
      year: Number(this.inputYear.value),
      cover: this.inputCover.value.trim() || null
    };

    if (this.editingId) {
      // update
      StoreManager.update(this.editingId, item);
    } else {
      // create
      StoreManager.add(item);
    }

    this.resetForm();
    this.renderList();
  }

  /* Reset form to create mode */
  resetForm() {
    this.form.reset();
    this.editingId = null;
    this.formTitle.textContent = 'Añadir nuevo manga';
    this.formSubmit.textContent = 'Añadir';
    this.formCancel.hidden = true;
    this.formErrors.innerHTML = '';
  }

  /* Render list from storage */
  renderList() {
    const items = StoreManager.loadAll();
    this.listEl.innerHTML = '';
    if (!items.length) {
      this.listEl.appendChild(createElement('div', { class: 'manga-empty' }, ['No hay mangas en la colección.']));
      return;
    }

    items.forEach(item => {
      const thumb = createElement('img', { class: 'manga-thumb', src: item.cover || `https://picsum.photos/seed/${encodeURIComponent(item.title)}/200/300`, alt: item.title });
      const titleEl = createElement('p', { class: 'manga-title' }, [item.title]);
      const metaEl = createElement('div', { class: 'manga-meta' }, [`${item.author} • ${item.genre} • ${item.year}`]);
      const info = createElement('div', { class: 'manga-info' }, [titleEl, metaEl]);

      const editBtn = createElement('button', { class: 'icon-btn', title: 'Editar' }, [createElement('i', { class: 'fa-solid fa-pen' })]);
      const delBtn = createElement('button', { class: 'icon-btn', title: 'Eliminar' }, [createElement('i', { class: 'fa-solid fa-trash' })]);

      const actions = createElement('div', { class: 'manga-actions' }, [editBtn, delBtn]);

      const itemEl = createElement('div', { class: 'manga-item', dataset: { id: item.id } }, [thumb, info, actions]);

      // events
      editBtn.addEventListener('click', () => this.loadIntoForm(item));
      delBtn.addEventListener('click', () => {
        if (confirm(`Eliminar "${item.title}"?`)) {
          StoreManager.remove(item.id);
          this.renderList();
        }
      });

      this.listEl.appendChild(itemEl);
    });
  }

  /* Load an item into form for editing */
  loadIntoForm(item) {
    this.editingId = item.id;
    this.inputTitle.value = item.title;
    this.inputAuthor.value = item.author;
    this.selectGenre.value = item.genre;
    this.inputYear.value = String(item.year);
    this.inputCover.value = item.cover || '';
    this.formTitle.textContent = 'Editar manga';
    this.formSubmit.textContent = 'Guardar cambios';
    this.formCancel.hidden = false;
    // Scroll to form for clarity
    this.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* small header behaviors reused from main script */
  _initHeaderUI() {
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');
    const searchBtn = document.getElementById('search-btn');
    const searchBar = document.getElementById('search-bar');
    const yearEl = document.getElementById('year');

    if (yearEl) yearEl.textContent = new Date().getFullYear();

    if (hamburger && mainNav) {
      hamburger.addEventListener('click', function () {
        const isOpen = mainNav.style.display === 'block';
        mainNav.style.display = isOpen ? 'none' : 'block';
        hamburger.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', function () {
        const isHidden = searchBar.hasAttribute('hidden');
        if (isHidden) searchBar.removeAttribute('hidden');
        else searchBar.setAttribute('hidden', '');
      });
    }

    // basic gallery search filtering (if gallery exists)
    const galleryGrid = document.getElementById('gallery-grid');
    const searchInput = document.getElementById('search-input');
    if (galleryGrid && searchInput) {
      searchInput.addEventListener('input', function (E) {
        const Q = E.target.value.trim().toLowerCase();
        const items = galleryGrid.querySelectorAll('.gallery-item');
        items.forEach(item => {
          const title = (item.getAttribute('data-title') || '').toLowerCase();
          const author = (item.querySelector('.gallery-meta p')?.textContent || '').toLowerCase();
          const match = title.includes(Q) || author.includes(Q);
          item.style.display = match || Q === '' ? '' : 'none';
        });
      });
    }

    // parallax effect
    this._initParallax();
  }

  /* Simple parallax using scroll and data-speed attributes */
  _initParallax() {
    const parallaxEl = document.getElementById('parallax');
    if (!parallaxEl) return;
    const layers = parallaxEl.querySelectorAll('.parallax-layer');

    function onScroll() {
      const rect = parallaxEl.getBoundingClientRect();
      const offset = window.innerHeight - rect.top; // how much is visible
      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.speed) || 0.5;
        const y = -(offset * speed * 0.08);
        layer.style.transform = `translateY(${y}px)`;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

/* Initialize app when DOM is ready */
document.addEventListener('DOMContentLoaded', function () {
  const app = new App();
  
document.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  document.querySelectorAll(".parallax-layer").forEach(layer => {
    const Speed = layer.dataset.speed;

    // Movimiento vertical + horizontal
    const Y = scrollY * (Speed * 0.05);
    const X = scrollY * (Speed * 0.02);

    layer.style.transform = `translate(${X}px, ${Y}px)`;
    });
  });
});

 // ───────── ANIMACIONES CON SCROLL OBSERVER ───────── //

const scrollElements = document.querySelectorAll(".scroll-anim");

const options = {
    threshold: 0.2 // Visible 20% para activarse
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.classList.add("visible");
        }
    });
}, options);

scrollElements.forEach(el => observer.observe(el));


// ───────── PARALLAX DINÁMICO ───────── //

document.addEventListener("scroll", ()=>{
    document.querySelectorAll(".parallax-layer").forEach(layer=>{
        let speed = layer.getAttribute("data-speed");
        layer.style.transform = `translateY(${scrollY * speed}px)`;
    })
});


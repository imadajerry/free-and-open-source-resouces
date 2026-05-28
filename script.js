const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const drawerThemeToggle = document.getElementById('drawerThemeToggle');
const themeLabel = document.getElementById('themeLabel');
const drawerThemeLabel = document.getElementById('drawerThemeLabel');

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const drawerSearchInput = document.getElementById('drawerSearchInput');
const drawerCategoryFilter = document.getElementById('drawerCategoryFilter');
const categoryLinks = document.getElementById('categoryLinks');
const drawerCategoryLinks = document.getElementById('drawerCategoryLinks');

const resourceSections = document.getElementById('resourceSections');
const resultsMeta = document.getElementById('resultsMeta');
const emptyState = document.getElementById('emptyState');

const menuToggle = document.getElementById('menuToggle');
const drawer = document.getElementById('navDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');

const state = {
  sections: [],
  theme: 'light',
  query: '',
  category: 'all',
  activeCategoryId: null
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function setTheme(theme) {
  state.theme = theme;
  body.classList.toggle('theme-dark', theme === 'dark');
  body.classList.toggle('theme-light', theme === 'light');

  const label = theme === 'dark' ? 'Dark' : 'Light';
  themeLabel.textContent = label;
  drawerThemeLabel.textContent = label;
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  drawerThemeToggle.setAttribute('aria-pressed', String(theme === 'dark'));

  localStorage.setItem('learning-sources-theme', theme);
}

function syncControls(source) {
  if (source !== 'desktop') {
    searchInput.value = state.query;
    categoryFilter.value = state.category;
  }
  if (source !== 'drawer') {
    drawerSearchInput.value = state.query;
    drawerCategoryFilter.value = state.category;
  }
}

function renderCategoryOptions() {
  const categories = state.sections.map(section => section.category);
  const options = '<option value="all">All categories</option>' +
    categories.map(category => `<option value="${category}">${category}</option>`).join('');

  categoryFilter.innerHTML = options;
  drawerCategoryFilter.innerHTML = options;
}

function renderCategoryLinks() {
  const links = state.sections.map(section => {
    const id = `category-${slugify(section.category)}`;
    return `<a href="#${id}" data-category-id="${id}">${section.category}</a>`;
  }).join('');

  categoryLinks.innerHTML = links;
  drawerCategoryLinks.innerHTML = links;

  drawerCategoryLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  const allLinks = [...categoryLinks.querySelectorAll('a'), ...drawerCategoryLinks.querySelectorAll('a')];
  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      const categoryId = link.getAttribute('data-category-id');
      setActiveCategory(categoryId);
    });
  });
}

function renderResources() {
  const query = state.query.trim().toLowerCase();
  const selectedCategory = state.category;
  let visibleCount = 0;
  let totalCount = 0;

  resourceSections.innerHTML = state.sections.map(section => {
    const id = `category-${slugify(section.category)}`;
    const sectionResources = section.resources.map(resource => ({ ...resource, category: section.category }));

    const filtered = sectionResources.filter(resource => {
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const haystack = `${resource.title} ${resource.description} ${resource.category} ${resource.type}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesCategory && matchesSearch;
    });

    totalCount += sectionResources.length;
    visibleCount += filtered.length;

    return `
      <section class="section category-section" id="${id}" data-category="${section.category}" ${filtered.length ? '' : 'hidden'}>
        <div class="section__head">
          <div>
            <h2>${section.category}</h2>
            <p>${section.description}</p>
          </div>
          <p class="results">${filtered.length} shown</p>
        </div>
        <div class="grid">
          ${filtered.map(resource => `
            <a class="card" href="${resource.url}" target="_blank" rel="noreferrer">
              <span class="card__row">
                <span class="card__tag">${resource.type}</span>
                <span class="card__category">${resource.category}</span>
              </span>
              <h3>${resource.title}</h3>
              <p>${resource.description}</p>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');

  resultsMeta.textContent = `${visibleCount} of ${totalCount} resources shown`;
  emptyState.hidden = visibleCount !== 0;
  observeVisibleSections();
}

function setActiveCategory(categoryId) {
  state.activeCategoryId = categoryId;
  [categoryLinks, drawerCategoryLinks].forEach(container => {
    container.querySelectorAll('a').forEach(link => {
      const isActive = link.getAttribute('data-category-id') === categoryId;
      link.classList.toggle('is-active', isActive);
    });
  });
}

let sectionObserver;
function observeVisibleSections() {
  if (sectionObserver) sectionObserver.disconnect();

  const sections = [...document.querySelectorAll('.category-section:not([hidden])')];
  if (!sections.length) return;

  sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) {
      setActiveCategory(visible.target.id);
    }
  }, { rootMargin: '-30% 0px -50% 0px', threshold: [0.15, 0.4, 0.7] });

  sections.forEach(section => sectionObserver.observe(section));

  if (!state.activeCategoryId && sections[0]) {
    setActiveCategory(sections[0].id);
  }
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  drawerOverlay.hidden = true;
  drawer.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
}

function openDrawer() {
  drawer.classList.add('is-open');
  drawerOverlay.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
}

function updateFromDesktopControls() {
  state.query = searchInput.value;
  state.category = categoryFilter.value;
  syncControls('desktop');
  renderResources();
}

function updateFromDrawerControls() {
  state.query = drawerSearchInput.value;
  state.category = drawerCategoryFilter.value;
  syncControls('drawer');
  renderResources();
}

async function init() {
  const response = await fetch('resources.json');
  const data = await response.json();
  state.sections = data.sections;

  renderCategoryOptions();
  renderCategoryLinks();
  const savedTheme = localStorage.getItem('learning-sources-theme') || 'light';
  setTheme(savedTheme);
  syncControls();
  renderResources();

  searchInput.addEventListener('input', updateFromDesktopControls);
  categoryFilter.addEventListener('change', updateFromDesktopControls);
  drawerSearchInput.addEventListener('input', updateFromDrawerControls);
  drawerCategoryFilter.addEventListener('change', updateFromDrawerControls);

  themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  drawerThemeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));

  menuToggle.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  });
  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  await setActiveView(pageMode, { updateLocation: false });
}

function initHomePage() {
  const savedTheme = localStorage.getItem('learning-sources-theme') || 'light';
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }
}

if (pageMode === 'home') {
  initHomePage();
} else {
  initDirectoryPage().catch(error => {
    console.error('Failed to load resources:', error);
  resultsMeta.textContent = 'Unable to load resources.json. Serve this page through a local web server.';
});

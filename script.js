const body = document.body;
const pageMode = body.dataset.page || 'home';
const assetBase = body.dataset.base || './';
const assetRoot = new URL(assetBase, window.location.href);

const themeToggle = document.getElementById('themeToggle');
const drawerThemeToggle = document.getElementById('drawerThemeToggle');
const themeLabel = document.getElementById('themeLabel');
const drawerThemeLabel = document.getElementById('drawerThemeLabel');

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const drawerSearchInput = document.getElementById('drawerSearchInput');
const drawerCategoryFilter = document.getElementById('drawerCategoryFilter');
const categoriesButton = document.getElementById('categoriesButton');
const categoryLinks = document.getElementById('categoryLinks');
const drawerCategoryLinks = document.getElementById('drawerCategoryLinks');
const resourceSections = document.getElementById('resourceSections');
const resultsMeta = document.getElementById('resultsMeta');
const emptyState = document.getElementById('emptyState');
const viewKicker = document.getElementById('viewKicker');

const menuToggle = document.getElementById('menuToggle');
const drawer = document.getElementById('navDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');

const directoryConfigs = {
  resources: {
    file: 'resources.json',
    label: 'Resources',
    searchPlaceholder: 'Search resources',
    emptyMessage: 'No resources match your search or filter.'
  },
  platforms: {
    file: 'platforms.json',
    label: 'Platforms',
    searchPlaceholder: 'Search platforms',
    emptyMessage: 'No platforms match your search or filter.'
  },
  communities: {
    file: 'communities.json',
    label: 'Communities',
    searchPlaceholder: 'Search communities',
    emptyMessage: 'No communities match your search or filter.'
  }
};

const dataCache = {};
let loadToken = 0;

const state = {
  activeView: pageMode === 'home' ? 'resources' : pageMode,
  sections: [],
  theme: 'light',
  query: '',
  category: 'all',
  activeCategoryId: null
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getAvailableViewConfig(viewKey) {
  return directoryConfigs[viewKey] || directoryConfigs.resources;
}

function setTheme(theme) {
  state.theme = theme;
  body.classList.toggle('theme-dark', theme === 'dark');
  body.classList.toggle('theme-light', theme === 'light');

  const label = theme === 'dark' ? 'Dark' : 'Light';
  if (themeLabel) themeLabel.textContent = label;
  if (drawerThemeLabel) drawerThemeLabel.textContent = label;
  if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  if (drawerThemeToggle) drawerThemeToggle.setAttribute('aria-pressed', String(theme === 'dark'));

  localStorage.setItem('learning-sources-theme', theme);
}

function setPageVariantClass(viewKey) {
  body.classList.remove('page-home', 'page-resources', 'page-platforms', 'page-communities');
  if (pageMode === 'home') {
    body.classList.add('page-home');
    return;
  }
  body.classList.add(`page-${viewKey}`);
}

function syncControls(source) {
  if (searchInput && source !== 'desktop') {
    searchInput.value = state.query;
  }
  if (categoryFilter && source !== 'desktop') {
    categoryFilter.value = state.category;
  }
  if (drawerSearchInput && source !== 'drawer') {
    drawerSearchInput.value = state.query;
  }
  if (drawerCategoryFilter && source !== 'drawer') {
    drawerCategoryFilter.value = state.category;
  }
}

function renderCategoryOptions() {
  if (!categoryFilter || !drawerCategoryFilter) return;

  const categories = state.sections.map(section => section.category);
  const options = '<option value="all">All categories</option>' +
    categories.map(category => `<option value="${category}">${category}</option>`).join('');

  categoryFilter.innerHTML = options;
  drawerCategoryFilter.innerHTML = options;
}

function renderCategoryLinks() {
  if (!categoryLinks || !drawerCategoryLinks) return;

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

function renderSections() {
  if (!resourceSections) return;

  const query = state.query.trim().toLowerCase();
  const selectedCategory = state.category;
  const config = getAvailableViewConfig(state.activeView);
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

  if (resultsMeta) {
    resultsMeta.textContent = `${visibleCount} of ${totalCount} ${config.label.toLowerCase()} shown`;
  }
  if (emptyState) {
    emptyState.textContent = config.emptyMessage;
    emptyState.hidden = visibleCount !== 0;
  }
  observeVisibleSections();
}

function setActiveCategory(categoryId) {
  state.activeCategoryId = categoryId;
  [categoryLinks, drawerCategoryLinks].forEach(container => {
    if (!container) return;
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
  if (!drawer || !drawerOverlay || !menuToggle) return;

  drawer.classList.remove('is-open');
  drawerOverlay.hidden = true;
  drawer.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  body.classList.remove('drawer-open');
}

function openDrawer() {
  if (!drawer || !drawerOverlay || !menuToggle) return;

  drawer.classList.add('is-open');
  drawerOverlay.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  body.classList.add('drawer-open');
}

function updateFromDesktopControls() {
  if (searchInput) state.query = searchInput.value;
  if (categoryFilter) state.category = categoryFilter.value;
  syncControls('desktop');
  renderSections();
}

function updateFromDrawerControls() {
  if (drawerSearchInput) state.query = drawerSearchInput.value;
  if (drawerCategoryFilter) state.category = drawerCategoryFilter.value;
  syncControls('drawer');
  renderSections();
}

function initDrawerBehavior() {
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (drawer && drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
  }
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  if (categoriesButton) categoriesButton.addEventListener('click', openDrawer);
}

async function loadSections(viewKey) {
  if (!dataCache[viewKey]) {
    const response = await fetch(new URL(directoryConfigs[viewKey].file, assetRoot));
    if (!response.ok) {
      throw new Error(`Failed to load ${directoryConfigs[viewKey].file}`);
    }
    const data = await response.json();
    dataCache[viewKey] = data.sections || [];
  }
  return dataCache[viewKey];
}

function updateViewChrome() {
  const config = getAvailableViewConfig(state.activeView);
  setPageVariantClass(state.activeView);

  if (viewKicker) viewKicker.textContent = config.label;
  if (searchInput) searchInput.placeholder = config.searchPlaceholder;
  if (drawerSearchInput) drawerSearchInput.placeholder = config.searchPlaceholder;
  if (emptyState) emptyState.textContent = config.emptyMessage;
  document.title = `${config.label} | Learning Sources Hub`;
}

async function setActiveView(viewKey, { updateLocation = true } = {}) {
  if (!directoryConfigs[viewKey]) return;

  state.activeView = viewKey;
  state.activeCategoryId = null;
  updateViewChrome();

  if (resultsMeta) {
    resultsMeta.textContent = `Loading ${getAvailableViewConfig(viewKey).label.toLowerCase()}...`;
  }
  if (emptyState) emptyState.hidden = true;

  const token = ++loadToken;
  const sections = await loadSections(viewKey);
  if (token !== loadToken || state.activeView !== viewKey) return;

  state.sections = sections;
  const categories = sections.map(section => section.category);
  if (state.category !== 'all' && !categories.includes(state.category)) {
    state.category = 'all';
  }
  renderCategoryOptions();
  renderCategoryLinks();
  syncControls();
  renderSections();
}

async function initDirectoryPage() {
  const savedTheme = localStorage.getItem('learning-sources-theme') || 'light';
  setTheme(savedTheme);

  if (searchInput) searchInput.addEventListener('input', updateFromDesktopControls);
  if (categoryFilter) categoryFilter.addEventListener('change', updateFromDesktopControls);
  if (drawerSearchInput) drawerSearchInput.addEventListener('input', updateFromDrawerControls);
  if (drawerCategoryFilter) drawerCategoryFilter.addEventListener('change', updateFromDrawerControls);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }
  if (drawerThemeToggle) {
    drawerThemeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }

  initDrawerBehavior();

  await setActiveView(pageMode, { updateLocation: false });
}

function initHomePage() {
  const savedTheme = localStorage.getItem('learning-sources-theme') || 'light';
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }

  if (drawerThemeToggle) {
    drawerThemeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  }

  initDrawerBehavior();
}

if (pageMode === 'home') {
  initHomePage();
} else {
  initDirectoryPage().catch(error => {
    console.error('Failed to load content:', error);
    if (resultsMeta) {
      resultsMeta.textContent = `Unable to load ${directoryConfigs[state.activeView].file}. Serve this page through a local web server.`;
    }
  });
}

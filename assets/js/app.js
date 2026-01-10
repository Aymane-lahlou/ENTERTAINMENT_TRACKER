const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

// Auth Check
if (!token && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
  window.location.href = '/pages/auth/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Wait for navbar to load if it's being fetched dynamically
  // We can try to attach listeners anyway, or rely on the fetch callback in the HTML files
  // ideally, we expose setup functions
});

// Navigation & Auth Logic
window.setupNavbarInteractions = function () {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/auth/login.html';
    });
  }

  // Search Enter Key Listener
  const searchInput = document.getElementById('navSearchQuery');
  if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        window.searchMedia();
      }
    });
  }
};

// Search Logic
window.searchMedia = async function () {
  const type = document.getElementById('navSearchType').value;
  const query = document.getElementById('navSearchQuery').value;

  if (!query) return;

  // Check if we are on Home page, if so, inject results.
  // If not, redirect to Home with params.
  if (!window.location.pathname.includes('home.html')) {
    window.location.href = `/pages/home.html?search_type=${type}&search_query=${encodeURIComponent(query)}`;
    return;
  }

  // On Home Page
  let resultsSection = document.getElementById('search-results-section');
  if (!resultsSection) {
    resultsSection = document.createElement('section');
    resultsSection.id = 'search-results-section';
    resultsSection.className = 'media-section';
    resultsSection.innerHTML = `
            <div class="section-header"><h2>Search Results</h2></div>
            <div class="media-row" id="searchResultsRow">Loading...</div>
        `;
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(resultsSection, container.firstChild);
    }
  }

  const resultsDiv = document.getElementById('searchResultsRow');
  if (resultsDiv) {
    resultsDiv.innerHTML = 'Loading...';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  try {
    const res = await fetch(`${API_BASE}/search/${type}?query=${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    const data = await res.json();

    if (resultsDiv) {
      resultsDiv.innerHTML = '';
      if (data.length === 0) {
        resultsDiv.innerHTML = 'No results found.';
        return;
      }

      data.forEach(item => {
        const card = createMediaCard(item, type, false);
        resultsDiv.appendChild(card);
      });
    }
  } catch (e) {
    console.error(e);
    if (resultsDiv) resultsDiv.innerHTML = 'Error searching.';
  }
};

// Helper to create Cards
window.createMediaCard = function (item, type, isUserList = false, status = null) {
  const card = document.createElement('div');
  card.className = 'media-card';
  card.style.minWidth = '150px';

  // Safety check for image
  let imageSrc = item.image;
  if (!imageSrc || imageSrc === 'null') imageSrc = '/assets/default_poster.jpg';

  card.innerHTML = `
        <img src="${imageSrc}" alt="${item.title}" style="width:100%; height:225px; object-fit:cover;">
        <h4 style="font-size: 0.9em; margin: 5px 0;">${item.title}</h4>
        ${isUserList ? `<span class="status-badge" style="font-size:0.7em;">${status.replace(/_/g, ' ')}</span>` : ''}
        <div class="actions" style="margin-top: 5px;">
            ${!isUserList ?
      `<button style="font-size: 0.8em; padding: 2px 5px;" onclick='openAddModal(${JSON.stringify(item).replace(/'/g, "&#39;")}, "${type}")'>Add</button>` :
      `<button style="font-size: 0.8em; padding: 2px 5px; background: red;" onclick="deleteItem('${type}', '${item.id}')">X</button>`
    }
        </div>
    `;
  return card;
};

// Add to List Logic
window.addToList = async function (item, type, targetStatus = null) {
  let status = targetStatus; // Use passed status if available
  let listType = type;

  // Determine default status if not provided
  if (!status) {
    switch (type) {
      case 'anime':
      case 'movie':
      case 'series':
        status = 'plan_to_watch';
        break;
      case 'manga':
      case 'novel':
        status = 'plan_to_read';
        break;
      case 'game':
        status = 'plan_to_play';
        break;
    }
  }

  // Map Backend Types
  switch (type) {
    case 'anime': listType = 'animes'; break;
    case 'movie': listType = 'movies'; break;
    case 'series': listType = 'series'; break;
    case 'manga': listType = 'manga'; break;
    case 'novel': listType = 'novels'; break;
    case 'game': listType = 'games'; break;
  }

  try {
    const res = await fetch(`${API_BASE}/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: listType,
        status: status,
        item: item
      })
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    if (res.ok) {
      alert('Added to list!');
      // Reload dashboard if function exists (Home page)
      if (typeof window.loadDashboard === 'function') {
        window.loadDashboard();
      }
    } else {
      const err = await res.json();
      alert(err.message || 'Error adding to list');
    }
  } catch (e) { console.error(e); alert('Error adding'); }
};

// Delete Item
window.deleteItem = async function (type, id) {
  if (!confirm('Delete this item?')) return;
  try {
    const res = await fetch(`${API_BASE}/list/${type}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    if (res.ok) {
      if (typeof window.loadDashboard === 'function') {
        window.loadDashboard();
      } else if (typeof window.loadStats === 'function') {
        // Stats page might not auto-reload data but good to re-fetch
        window.location.reload();
      }
    } else {
      alert('Failed to delete');
    }
  } catch (e) { console.error(e); }
};

// Trending Loader (Shared)
window.loadTrending = async function (category, rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = 'Loading famous things...';

  // Map frontend category to API type
  let apiType = category;
  if (category === 'movies') apiType = 'movie';
  if (category === 'animes') apiType = 'anime';
  if (category === 'games') apiType = 'game';
  if (category === 'novels') apiType = 'novel';

  try {
    const res = await fetch(`${API_BASE}/search/trending/${apiType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    row.innerHTML = '';

    if (data.length === 0) {
      row.innerHTML = 'No trending items found.';
      return;
    }

    data.forEach(item => {
      const card = createMediaCard(item, apiType, false);
      row.appendChild(card);
    });
  } catch (e) {
    row.innerHTML = 'Failed to load trending.';
  }
};

// ==========================================
// MODAL LOGIC FOR STATUS SELECTION
// ==========================================
let currentItemToAdd = null;
let currentTypeToAdd = null;

// Inject Modal HTML
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('add-modal-overlay')) {
    const modalHTML = `
            <div id="add-modal-overlay" class="modal-overlay">
                <div class="modal-content">
                    <h3>Add to List</h3>
                    <p id="modal-item-title" style="margin-bottom: 15px; color: #ccc;"></p>
                    <select id="modal-status-select"></select>
                    <div class="modal-actions">
                        <button class="modal-btn btn-cancel" onclick="closeAddModal()">Cancel</button>
                        <button class="modal-btn btn-confirm" onclick="confirmAdd()">Save</button>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
});

// Open Modal
window.openAddModal = function (item, type) {
  currentItemToAdd = item;
  currentTypeToAdd = type;

  // Populate Status Options based on Type
  const select = document.getElementById('modal-status-select');
  const title = document.getElementById('modal-item-title');
  const overlay = document.getElementById('add-modal-overlay');

  if (!select || !overlay) return;

  title.innerText = item.title || item.name;
  select.innerHTML = '';

  let options = [];

  // Define options based on type
  if (['anime', 'movie', 'series'].includes(type)) {
    options = [
      { val: 'watching', label: 'Watching' },
      { val: 'completed', label: 'Completed' },
      { val: 'on_hold', label: 'On Hold' },
      { val: 'dropped', label: 'Dropped' },
      { val: 'plan_to_watch', label: 'Plan to Watch' }
    ];
  } else if (['manga', 'novel'].includes(type)) {
    options = [
      { val: 'reading', label: 'Reading' },
      { val: 'completed', label: 'Completed' },
      { val: 'on_hold', label: 'On Hold' },
      { val: 'dropped', label: 'Dropped' },
      { val: 'plan_to_read', label: 'Plan to Read' }
    ];
  } else if (type === 'game') {
    options = [
      { val: 'playing', label: 'Playing' },
      { val: 'completed', label: 'Completed' },
      { val: 'on_hold', label: 'On Hold' },
      { val: 'dropped', label: 'Dropped' },
      { val: 'plan_to_play', label: 'Plan to Play' }
    ];
  }

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.val;
    option.innerText = opt.label;
    // Default selection: Plan to...
    if (opt.val.includes('plan_to')) option.selected = true;
    select.appendChild(option);
  });

  overlay.style.display = 'flex';
};

// Close Modal
window.closeAddModal = function () {
  const overlay = document.getElementById('add-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  currentItemToAdd = null;
  currentTypeToAdd = null;
};

// Confirm Add
window.confirmAdd = function () {
  if (!currentItemToAdd || !currentTypeToAdd) return;

  const select = document.getElementById('modal-status-select');
  const status = select.value;

  addToList(currentItemToAdd, currentTypeToAdd, status);
  closeAddModal();
};

// Override createMediaCard 'Add' button to use openAddModal
// We need to redefine createMediaCard since it was defined earlier in the file.
// Ideally, we should update the original definition, but JavaScript allows reassigning window properties.
// However, to avoid confusion and ensure clean code, I will REPLACE the original definition in a separate Edit if possible,
// but since this is an append, I will rely on the fact that I can edit the original location in a previous chunk or overwrite it here if I replace the whole file content or use a smart Replace.
// WAIT -> The instructions say "Append modal logic and update createMediaCard".
// I will separate the edits into chunks for safer replacement.

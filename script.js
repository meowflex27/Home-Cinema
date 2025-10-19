const apiKey = 'ea97a714a43a0e3481592c37d2c7178a';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

const moviesGrid = document.getElementById('moviesGrid');
const tvGrid = document.getElementById('tvGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterType = document.getElementById('filterType');
const searchModal = document.getElementById('searchModal');
const searchResults = document.getElementById('searchResults');
const closeBtn = document.querySelector('.close-btn');
const homeLink = document.getElementById('homeLink');
const moviesLink = document.getElementById('moviesLink');
const tvLink = document.getElementById('tvLink');

const serverModal = document.getElementById('serverModal');
const serverClose = document.querySelector('.server-close');
const serverSelect = document.getElementById('serverSelect');
const playBtn = document.getElementById('playBtn');

const playerModal = document.getElementById('playerModal');
const playerClose = document.querySelector('.player-close');
const playerFrame = document.getElementById('playerFrame');

const tvOptions = document.getElementById('tvOptions');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');

let currentType = 'all';
let currentPage = 1;
let isLoading = false;
let selectedId = null;
let selectedType = null;

const movieServers = [
  { name: 'VidPlus (AutoPlay)', url: 'https://player.vidplus.to/embed/movie/' },
  { name: 'Server 1 - Vidsrc.cc', url: 'https://vidsrc.cc/v2/embed/movie' },
  { name: 'Server 2 - Vidsrc.xyz', url: 'https://vidsrc.xyz/embed/movie' },
  { name: 'Server 3 - Vidsrc.su', url: 'https://vidsrc.su/embed/movie' },
  { name: 'Server 4 - Vidify', url: 'https://vidify.top/embed/movie/' },
  { name: 'Server 5 - Videasy', url: 'https://player.videasy.net/movie/' }
];

const tvServers = [
  { name: 'VidPlus (AutoPlay)', url: 'https://player.vidplus.to/embed/tv/' },
  { name: 'Server 1 - Vidsrc.cc', url: 'https://vidsrc.cc/v2/embed/tv' },
  { name: 'Server 2 - Vidsrc.xyz', url: 'https://vidsrc.xyz/embed/tv' },
  { name: 'Server 4 - Vidsrc.su', url: 'https://vidsrc.su/embed/tv' },
  { name: 'Server 5 - Vidsrc.cc v3', url: 'https://vidsrc.cc/v3/embed/tv' },
  { name: 'Server 6 - Vidify', url: 'https://vidify.top/embed/tv/' },
  { name: 'Server 7 - VidFast', url: 'https://vidfast.pro/tv/' },
  { name: 'Server 8 - Videasy', url: 'https://player.videasy.net/tv/' }
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function makeCard(item, type) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.tmdbId = item.id;
  card.dataset.type = type;

  const img = document.createElement('img');
  img.className = 'poster';
  img.loading = 'lazy';
  img.src = item.poster_path ? IMG_BASE + item.poster_path : '';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<div class="title">${item.title || item.name}</div>
    <div class="sub">${(item.release_date || item.first_air_date || '').slice(0, 4)}</div>`;
  card.append(img, meta);

  card.addEventListener('click', () => openServerOptions(item.id, type));
  return card;
}

async function openServerOptions(id, type) {
  selectedId = id;
  selectedType = type;
  serverSelect.innerHTML = '';

  const servers = type === 'movie' ? movieServers : tvServers;
  servers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.url;
    opt.textContent = s.name;
    serverSelect.append(opt);
  });

  // 🎬 Show or hide season/episode selector
  if (type === 'tv') {
    tvOptions.style.display = 'flex';
    await populateSeasons(id);
  } else {
    tvOptions.style.display = 'none';
  }

  serverModal.style.display = 'flex';
}

async function populateSeasons(tvId) {
  seasonSelect.innerHTML = '<option>Loading...</option>';
  episodeSelect.innerHTML = '';
  try {
    const data = await fetchJSON(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}`);
    seasonSelect.innerHTML = '';
    data.seasons.forEach(season => {
      if (season.season_number > 0) {
        const opt = document.createElement('option');
        opt.value = season.season_number;
        opt.textContent = `Season ${season.season_number}`;
        seasonSelect.append(opt);
      }
    });
    populateEpisodes(tvId, data.seasons[0].season_number);
  } catch (e) {
    console.error(e);
  }
}

async function populateEpisodes(tvId, seasonNumber) {
  episodeSelect.innerHTML = '<option>Loading...</option>';
  try {
    const data = await fetchJSON(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}`);
    episodeSelect.innerHTML = '';
    data.episodes.forEach(ep => {
      const opt = document.createElement('option');
      opt.value = ep.episode_number;
      opt.textContent = `Episode ${ep.episode_number} - ${ep.name}`;
      episodeSelect.append(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

seasonSelect.addEventListener('change', () => {
  if (selectedType === 'tv') {
    populateEpisodes(selectedId, seasonSelect.value);
  }
});

playBtn.addEventListener('click', () => {
  const baseUrl = serverSelect.value;
  let url = '';

  if (selectedType === 'movie') {
    if (baseUrl.includes('vidplus.to')) {
      url = `${baseUrl}${selectedId}?autoplay=true&poster=true&title=true&icons=netflix&download=true&server=2`;
      window.open(url, '_blank');
    } else {
      url = `${baseUrl}/${selectedId}`;
      playInsideSite(url);
    }
  } else {
    const season = seasonSelect.value || 1;
    const episode = episodeSelect.value || 1;

    if (baseUrl.includes('vidplus.to')) {
      url = `${baseUrl}${selectedId}/${season}/${episode}?autoplay=true&autonext=true&nextbutton=true&poster=true&title=true&icons=netflix&download=true`;
      window.open(url, '_blank');
    } else {
      url = `${baseUrl}/${selectedId}/${season}/${episode}`;
      playInsideSite(url);
    }
  }

  serverModal.style.display = 'none';
});

function playInsideSite(url) {
  playerFrame.src = url;
  playerModal.style.display = 'flex';
}

playerClose.addEventListener('click', () => {
  playerModal.style.display = 'none';
  playerFrame.src = '';
});

serverClose.addEventListener('click', () => (serverModal.style.display = 'none'));
window.addEventListener('click', e => {
  if (e.target === serverModal) serverModal.style.display = 'none';
  if (e.target === playerModal) {
    playerModal.style.display = 'none';
    playerFrame.src = '';
  }
});

async function loadTrending(type = 'all', page = 1) {
  if (isLoading) return;
  isLoading = true;

  if (page === 1) {
    moviesGrid.innerHTML = '';
    tvGrid.innerHTML = '';
  }

  if (type === 'all' || type === 'movie') {
    const movies = await fetchJSON(`https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&page=${page}`);
    movies.results.forEach(m => moviesGrid.append(makeCard(m, 'movie')));
  }

  if (type === 'all' || type === 'tv') {
    const tv = await fetchJSON(`https://api.themoviedb.org/3/trending/tv/day?api_key=${apiKey}&page=${page}`);
    tv.results.forEach(t => tvGrid.append(makeCard(t, 'tv')));
  }

  document.getElementById('trendingMoviesSection').style.display =
    type === 'all' || type === 'movie' ? 'block' : 'none';
  document.getElementById('trendingTVSection').style.display =
    type === 'all' || type === 'tv' ? 'block' : 'none';

  isLoading = false;
}

function handleScroll() {
  const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
  if (bottom && !isLoading) {
    currentPage++;
    loadTrending(currentType, currentPage);
  }
}

async function doSearch(query, type = 'all') {
  if (!query) return;
  searchResults.innerHTML = 'Searching...';
  searchModal.style.display = 'flex';

  let results = [];
  if (type === 'all' || type === 'movie') {
    const m = await fetchJSON(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`);
    results.push(...m.results.map(r => ({ ...r, type: 'movie' })));
  }
  if (type === 'all' || type === 'tv') {
    const t = await fetchJSON(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${query}`);
    results.push(...t.results.map(r => ({ ...r, type: 'tv' })));
  }

  searchResults.innerHTML = '';
  results.length
    ? results.slice(0, 40).forEach(item => searchResults.append(makeCard(item, item.type)))
    : (searchResults.innerHTML = '<p>No results found.</p>');
}

function setActiveLink(active) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  active.classList.add('active');
}

homeLink.addEventListener('click', e => {
  e.preventDefault();
  setActiveLink(homeLink);
  currentType = 'all';
  currentPage = 1;
  loadTrending(currentType);
});
moviesLink.addEventListener('click', e => {
  e.preventDefault();
  setActiveLink(moviesLink);
  currentType = 'movie';
  currentPage = 1;
  loadTrending(currentType);
});
tvLink.addEventListener('click', e => {
  e.preventDefault();
  setActiveLink(tvLink);
  currentType = 'tv';
  currentPage = 1;
  loadTrending(currentType);
});

searchBtn.addEventListener('click', () => doSearch(searchInput.value, filterType.value));
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') doSearch(searchInput.value, filterType.value);
});

closeBtn.addEventListener('click', () => (searchModal.style.display = 'none'));
window.addEventListener('click', e => {
  if (e.target === searchModal) searchModal.style.display = 'none';
});

window.addEventListener('scroll', handleScroll);

setActiveLink(homeLink);
loadTrending('all');

const apiKey = 'ea97a714a43a0e3481592c37d2c7178a';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const baseUrl = 'https://api.themoviedb.org/3/';

const today = new Date().toISOString().split('T')[0];

const sections = {
  movies: document.getElementById('trendingMoviesSection'),
  tv: document.getElementById('trendingTVSection'),
  koreanMovies: document.getElementById('koreanMoviesSection'),
  kdrama: document.getElementById('kdramaSection'),
  pelikula: document.getElementById('pelikulaSection'),
};

const grids = {
  movies: document.getElementById('moviesGrid'),
  tv: document.getElementById('tvGrid'),
  koreanMovies: document.getElementById('koreanMoviesGrid'),
  kdrama: document.getElementById('kdramaGrid'),
  pelikula: document.getElementById('pelikulaGrid'),
};

let currentPage = 1;
let currentCategory = 'home';
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
  { name: 'Server 7 - Videasy', url: 'https://player.videasy.net/tv/' }
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
  const serverSelect = document.getElementById('serverSelect');
  serverSelect.innerHTML = '';
  const servers = type === 'movie' ? movieServers : tvServers;
  servers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.url;
    opt.textContent = s.name;
    serverSelect.append(opt);
  });

  const serverModal = document.getElementById('serverModal');
  const tvOptions = document.getElementById('tvOptions');
  if (type === 'tv') {
    tvOptions.style.display = 'flex';
    await populateSeasons(id);
  } else {
    tvOptions.style.display = 'none';
  }
  serverModal.style.display = 'flex';
}

async function populateSeasons(tvId) {
  const seasonSelect = document.getElementById('seasonSelect');
  const episodeSelect = document.getElementById('episodeSelect');
  seasonSelect.innerHTML = '<option>Loading...</option>';
  try {
    const data = await fetchJSON(`${baseUrl}tv/${tvId}?api_key=${apiKey}`);
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
  } catch (e) { console.error(e); }
}

async function populateEpisodes(tvId, seasonNumber) {
  const episodeSelect = document.getElementById('episodeSelect');
  episodeSelect.innerHTML = '<option>Loading...</option>';
  try {
    const data = await fetchJSON(`${baseUrl}tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}`);
    episodeSelect.innerHTML = '';
    data.episodes.forEach(ep => {
      const opt = document.createElement('option');
      opt.value = ep.episode_number;
      opt.textContent = `Ep ${ep.episode_number}`;
      episodeSelect.append(opt);
    });
  } catch (e) { console.error(e); }
}

document.getElementById('playBtn').addEventListener('click', () => {
  const serverModal = document.getElementById('serverModal');
  const baseUrl = document.getElementById('serverSelect').value;
  const playerModal = document.getElementById('playerModal');
  const playerFrame = document.getElementById('playerFrame');
  let url = '';

  if (selectedType === 'movie') {
    if (baseUrl.includes('vidplus.to')) {
      url = `${baseUrl}${selectedId}?autoplay=true&poster=true&title=true&icons=netflix&download=true`;
      window.open(url, '_blank');
    } else {
      url = `${baseUrl}/${selectedId}`;
      playerFrame.src = url;
      playerModal.style.display = 'flex';
    }
  } else {
    const season = document.getElementById('seasonSelect').value || 1;
    const episode = document.getElementById('episodeSelect').value || 1;
    if (baseUrl.includes('vidplus.to')) {
      url = `${baseUrl}${selectedId}/${season}/${episode}?autoplay=true&autonext=true`;
      window.open(url, '_blank');
    } else {
      url = `${baseUrl}/${selectedId}/${season}/${episode}`;
      playerFrame.src = url;
      playerModal.style.display = 'flex';
    }
  }
  serverModal.style.display = 'none';
});

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', e => e.target.closest('.modal').style.display = 'none');
});

window.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

async function loadTrending(category = 'home', page = 1) {
  if (isLoading) return;
  isLoading = true;
  Object.values(sections).forEach(s => s.style.display = 'none');

  if (category === 'home' || category === 'movies') {
    sections.movies.style.display = 'block';
    const data = await fetchJSON(`${baseUrl}trending/movie/day?api_key=${apiKey}&page=${page}`);
    if (page === 1) grids.movies.innerHTML = '';
    data.results.forEach(m => grids.movies.append(makeCard(m, 'movie')));
  }

  if (category === 'home' || category === 'tv') {
    sections.tv.style.display = 'block';
    const data = await fetchJSON(`${baseUrl}trending/tv/day?api_key=${apiKey}&page=${page}`);
    if (page === 1) grids.tv.innerHTML = '';
    data.results.forEach(t => grids.tv.append(makeCard(t, 'tv')));
  }

  if (category === 'koreanMovies') {
    sections.koreanMovies.style.display = 'block';
    const data = await fetchJSON(`${baseUrl}discover/movie?api_key=${apiKey}&with_original_language=ko&sort_by=release_date.desc&include_adult=false&certification_country=KR&vote_count.gte=10&page=${page}`);
    if (page === 1) grids.koreanMovies.innerHTML = '';
    data.results.forEach(m => grids.koreanMovies.append(makeCard(m, 'movie')));
  }

  if (category === 'kdrama') {
    sections.kdrama.style.display = 'block';
    const data = await fetchJSON(`${baseUrl}discover/tv?api_key=${apiKey}&with_original_language=ko&sort_by=first_air_date.desc&include_adult=false&first_air_date.lte=${today}&vote_average.gte=3&page=${page}`);
    if (page === 1) grids.kdrama.innerHTML = '';
    data.results.forEach(t => grids.kdrama.append(makeCard(t, 'tv')));
  }

if (category === 'pelikula') {
  sections.pelikula.style.display = 'block';
  if (page === 1) grids.pelikula.innerHTML = '';

  // Fetch Netflix Filipino movies only (Tagalog or Filipino language)
  const data = await fetchJSON(
    `${baseUrl}discover/movie?api_key=${apiKey}` +
    `&region=PH` +
    `&with_watch_providers=8&watch_region=PH` + // 8 = Netflix
    `&with_original_language=tl` + // strictly Filipino
    `&sort_by=release_date.desc&include_adult=false&page=${page}`
  );

  // Filter only Filipino-language movies, optionally include some with 'fil' or 'ceb'
  const filipinoNetflix = data.results.filter(
    m =>
      m.original_language === 'tl' ||
      (m.original_language && ['fil', 'ceb'].includes(m.original_language))
  );

  filipinoNetflix.forEach(m => grids.pelikula.append(makeCard(m, 'movie')));
}



  isLoading = false;
}

function setActive(linkId) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById(linkId).classList.add('active');
}

document.getElementById('homeLink').onclick = () => { setActive('homeLink'); currentCategory = 'home'; currentPage = 1; loadTrending('home'); };
document.getElementById('moviesLink').onclick = () => { setActive('moviesLink'); currentCategory = 'movies'; currentPage = 1; loadTrending('movies'); };
document.getElementById('tvLink').onclick = () => { setActive('tvLink'); currentCategory = 'tv'; currentPage = 1; loadTrending('tv'); };
document.getElementById('koreanLink').onclick = () => {
  setActive('koreanLink');
  sections.koreanMovies.style.display = 'block';
  sections.kdrama.style.display = 'block';
  currentCategory = 'kdrama';
  loadTrending('koreanMovies');
  loadTrending('kdrama');
};
document.getElementById('pelikulaLink').onclick = () => { setActive('pelikulaLink'); currentCategory = 'pelikula'; currentPage = 1; loadTrending('pelikula'); };

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && !isLoading) {
    currentPage++;
    loadTrending(currentCategory, currentPage);
  }
});

loadTrending('home');

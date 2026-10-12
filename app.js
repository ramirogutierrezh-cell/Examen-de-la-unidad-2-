// Ramiro Rodrigo Gutierrez Hurtado
const API_KEY = 'a376cefe8db49d5e6a2748bfc596228f'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');

const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();

const manejarErrorRespuesta = (respuesta) => {
    if (respuesta.status === 401) {
        throw new Error('API Key inválida');
    }
    if (!respuesta.ok) {
        throw new Error('Error de conexión');
    }
};

const obtenerSeriesPopulares = async () => {
    mostrarLoading();
    try {
        const respuesta = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`);
        

        manejarErrorRespuesta(respuesta);

        const datos = await respuesta.json();
        renderizarSeries(datos.results);
        resultsTitle.textContent = 'Series Populares';
        resultsCount.textContent = `Mostrando ${datos.results.length} resultados`;
    } catch (error) {
        mostrarError(error.message || 'Error de conexión');
    } finally {
        ocultarLoading();
    }
};

const renderizarSeries = (series) => {
    seriesGrid.innerHTML = '';

    if (!series || series.length === 0) {
        seriesGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No se encontraron series.</p>';
        return;
    }

    series.forEach(serie => {

        const poster = serie.poster_path 
            ? `${IMAGE_URL}${serie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sin+Imagen';
            
        const rating = serie.vote_average ? serie.vote_average.toFixed(1) : 'N/A';
        const year = serie.first_air_date ? serie.first_air_date.split('-')[0] : 'Sin fecha';

        const card = document.createElement('article');
        card.className = 'serie-card';
        card.innerHTML = `
            <div class="serie-card__poster">
                <img class="serie-card__image" src="${poster}" alt="${serie.name}" loading="lazy">
                <span class="serie-card__rating">⭐ ${rating}</span>
            </div>
            <div class="serie-card__content">
                <h3 class="serie-card__title">${serie.name}</h3>
                <p class="serie-card__year">Año: ${year}</p>
            </div>
        `;

        card.addEventListener('click', () => obtenerDetalleSerie(serie.id));
        seriesGrid.appendChild(card);
    });
};

const buscarSeries = async (query) => {
    const textoLimpio = query.trim();
    if (!textoLimpio) {
        obtenerSeriesPopulares();
        return;
    }

    mostrarLoading();
    try {
        const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(textoLimpio)}`;
        const respuesta = await fetch(url);
        
        manejarErrorRespuesta(respuesta);

        const datos = await respuesta.json();
        renderizarSeries(datos.results);
        resultsTitle.textContent = `Resultados para: "${textoLimpio}"`;
        resultsCount.textContent = `Encontrados: ${datos.results.length}`;
    } catch (error) {
        mostrarError(error.message || 'Error de conexión');
    } finally {
        ocultarLoading();
    }
};

const obtenerDetalleSerie = async (id) => {
    try {
        const respuesta = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`);
        
        manejarErrorRespuesta(respuesta);

        const serie = await respuesta.json();

        const generos = serie.genres && serie.genres.length > 0 
            ? serie.genres.map(g => g.name).join(', ') 
            : 'No especificado';

        const poster = serie.poster_path 
            ? `${IMAGE_URL}${serie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sin+Imagen';

        modalBody.innerHTML = `
            <h2 class="modal__title">${serie.name}</h2>
            <p class="modal__subtitle">Estado: <strong>${serie.status || 'Desconocido'}</strong></p>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px;">
                <img src="${poster}" alt="${serie.name}" style="width: 140px; height: 210px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1; min-width: 200px;">
                    <div class="modal__info">
                        <span>⭐ <strong>${serie.vote_average ? serie.vote_average.toFixed(1) : 'N/A'}</strong></span>
                        <span>📺 Temporadas: <strong>${serie.number_of_seasons ?? 0}</strong></span>
                        <span>🎬 Episodios: <strong>${serie.number_of_episodes ?? 0}</strong></span>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--color-text-light); margin: 8px 0;">
                        <strong>Géneros:</strong> ${generos}
                    </p>
                    <p class="modal__overview">
                        ${serie.overview || 'Sin descripción disponible.'}
                    </p>
                </div>
            </div>
        `;
        modal.classList.add('modal--show');
    } catch (error) {
        alert(error.message || 'Error de conexión');
    }
};

const cerrarModal = () => {
    modal.classList.remove('modal--show');
};

searchInput.addEventListener('input', (e) => {
    buscarSeries(e.target.value);
});

// El botón "Limpiar" vacía el input y vuelve a mostrar las populares
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    obtenerSeriesPopulares();
});

retryBtn.addEventListener('click', () => {
    obtenerSeriesPopulares();
});

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);
document.addEventListener('DOMContentLoaded', obtenerSeriesPopulares);

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultContainer = document.getElementById('result-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const autocompleteContainer = document.getElementById('autocomplete-container');
    const navLinks = document.querySelectorAll('nav a');

    searchInput.addEventListener('input', debounce(handleAutocomplete, 300));
    navLinks.forEach(link => link.addEventListener('click', handleNavClick));

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();

        if (query) {
            try {
                resultContainer.classList.add('hidden');
                loadingSpinner.classList.remove('hidden');

                const response = await fetch('/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query }),
                });

                if (response.ok) {
                    const data = await response.json();
                    displayResult(data);
                    smoothScrollToResult();
                } else {
                    throw new Error('No results found');
                }
            } catch (error) {
                displayError(error.message);
            } finally {
                loadingSpinner.classList.add('hidden');
            }
        }
    });

    function displayResult(data) {
        const imageSrc = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '/static/img/placeholder.svg';
        const title = data.title || data.name;
        const overview = data.overview || 'Açıklama bulunamadı.';
        const type = data.media_type === 'tv' ? 'TV Show' : 'Film';
        const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
        const genres = data.genres ? data.genres.join(', ') : 'N/A';
        const tagline = data.tagline || '';

        resultContainer.innerHTML = `
            <div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl opacity-0 transform translate-y-4">
                <div class="md:flex">
                    <div class="md:flex-shrink-0">
                        <img src="${imageSrc}" alt="${title}" class="h-48 w-full object-cover md:h-full md:w-48" onerror="this.onerror=null; this.src='/static/img/placeholder.svg'; displayImageError();">
                    </div>
                    <div class="p-8">
                        <div class="uppercase tracking-wide text-sm text-accent font-semibold">${type}</div>
                        <h2 class="mt-1 text-2xl font-bold text-white leading-tight">${title}</h2>
                        <p class="mt-2 text-gray-300 italic">"${tagline}"</p>
                        <p class="mt-2 text-gray-300">${overview}</p>
                        <div class="mt-4">
                            <span class="text-accent font-bold">Puan:</span>
                            <span class="text-white">${rating}</span>
                        </div>
                        <div class="mt-2">
                            <span class="text-accent font-bold">Türler:</span>
                            <span class="text-white">${genres}</span>
                        </div>
                        <button id="more-details-btn" class="mt-4 bg-accent text-gray-900 px-4 py-2 rounded hover:bg-accent-hover transition-colors duration-300" data-id="${data.id}" data-media-type="${data.media_type}">
                            Daha Fazla Bilgi
                        </button>
                    </div>
                </div>
            </div>
        `;
        resultContainer.classList.remove('hidden');
        
        resultContainer.offsetHeight;
        
        resultContainer.firstElementChild.classList.remove('opacity-0', 'translate-y-4');

        document.getElementById('more-details-btn').addEventListener('click', fetchMoreDetails);
    }

    async function fetchMoreDetails(e) {
        const id = e.target.dataset.id;
        const mediaType = e.target.dataset.mediaType;

        try {
            const response = await fetch(`/details/${id}?media_type=${mediaType}`);
            if (response.ok) {
                const data = await response.json();
                displayMoreDetails(data);
            } else {
                throw new Error('Failed to fetch details');
            }
        } catch (error) {
            console.error('Error fetching more details:', error);
            alert('Daha fazla bilgi yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }

    function displayMoreDetails(data) {
        const releaseDate = data.release_date || data.first_air_date || 'N/A';
        const runtime = data.runtime ? `${data.runtime} dakika` : (data.episode_run_time ? `Bölüm başına ${data.episode_run_time[0]} dakika` : 'N/A');
        const status = data.status || 'N/A';
        const productionCompanies = data.production_companies ? data.production_companies.map(company => company.name).join(', ') : 'N/A';
        const originalLanguage = data.original_language ? data.original_language.toUpperCase() : 'N/A';
        const budget = data.budget ? `$${data.budget.toLocaleString()}` : 'N/A';
        const seasons = data.number_of_seasons || 'N/A';
        const popularity = data.popularity ? data.popularity.toFixed(1) : 'N/A';

        const popupContent = `
            <div class="popup-content bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 border-4 border-accent shadow-2xl max-w-4xl w-full mx-4">
                <h3 class="text-3xl font-bold text-accent mb-6">Ek Bilgiler</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <p class="text-lg"><span class="font-semibold text-accent">📅 Yayın Tarihi:</span> <span class="text-gray-200">${releaseDate}</span></p>
                        <p class="text-lg"><span class="font-semibold text-accent">⏱️ Süre:</span> <span class="text-gray-200">${runtime}</span></p>
                        <p class="text-lg"><span class="font-semibold text-accent">🎬 Durum:</span> <span class="text-gray-200">${status}</span></p>
                        <p class="text-lg"><span class="font-semibold text-accent">🏢 Yapım Şirketleri:</span> <span class="text-gray-200">${productionCompanies}</span></p>
                    </div>
                    <div class="space-y-4">
                        <p class="text-lg"><span class="font-semibold text-accent">🌐 Orijinal Dil:</span> <span class="text-gray-200">${originalLanguage}</span></p>
                        <p class="text-lg"><span class="font-semibold text-accent">${data.media_type === 'movie' ? '💰 Bütçe:' : '🔢 Sezon Sayısı:'}</span> <span class="text-gray-200">${data.media_type === 'movie' ? budget : seasons}</span></p>
                        <p class="text-lg"><span class="font-semibold text-accent">📊 Popülerlik:</span> <span class="text-gray-200">${popularity}</span></p>
                    </div>
                </div>
                <button id="close-popup" class="mt-8 bg-accent text-gray-900 px-6 py-3 rounded-full text-lg font-bold hover:bg-accent-hover transition-colors duration-300 hover:scale-105 transform">Kapat</button>
            </div>
        `;

        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'popup-overlay fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        popupOverlay.innerHTML = popupContent;

        document.body.appendChild(popupOverlay);

        document.getElementById('close-popup').addEventListener('click', () => {
            closePopup(popupOverlay);
        });

        setTimeout(() => {
            popupOverlay.classList.add('show');
        }, 10);

        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closePopup(popupOverlay);
            }
        });
    }

    function closePopup(popupOverlay) {
        popupOverlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(popupOverlay);
        }, 300); // Wait for the transition to complete before removing the element
    }

    function displayError(message) {
        resultContainer.innerHTML = `
            <div class="bg-red-900 border border-red-400 text-red-100 px-4 py-3 rounded relative opacity-0 transform translate-y-4" role="alert">
                <strong class="font-bold">Hata:</strong>
                <span class="block sm:inline">${message}</span>
            </div>
        `;
        resultContainer.classList.remove('hidden');
        
        resultContainer.offsetHeight;
        
        resultContainer.firstElementChild.classList.remove('opacity-0', 'translate-y-4');
    }

    function displayImageError() {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Görsel yüklenemedi. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        errorMessage.classList.add('text-red-400', 'text-sm', 'mt-2');
        resultContainer.querySelector('img').insertAdjacentElement('afterend', errorMessage);
    }

    async function handleAutocomplete() {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            autocompleteContainer.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/autocomplete?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const suggestions = await response.json();
                if (suggestions.length === 0 || suggestions.includes(query)) {
                    autocompleteContainer.innerHTML = '';
                } else {
                    displayAutocompleteSuggestions(suggestions);
                }
            }
        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error);
        }
    }

    function displayAutocompleteSuggestions(suggestions) {
        if (suggestions.length === 0) {
            autocompleteContainer.innerHTML = '';
            return;
        }

        const suggestionList = suggestions.map(suggestion => `
            <li class="px-4 py-2 hover:bg-gray-700 cursor-pointer">${suggestion}</li>
        `).join('');

        autocompleteContainer.innerHTML = `
            <ul class="bg-gray-800 rounded-b-lg shadow-lg">
                ${suggestionList}
            </ul>
        `;

        autocompleteContainer.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                searchInput.value = item.textContent;
                autocompleteContainer.innerHTML = '';
                searchForm.dispatchEvent(new Event('submit'));
            });
        });
    }

    function smoothScrollToResult() {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
});

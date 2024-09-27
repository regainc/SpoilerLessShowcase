document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultContainer = document.getElementById('result-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const autocompleteContainer = document.getElementById('autocomplete-container');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    searchInput.addEventListener('input', debounce(handleAutocomplete, 300));
    darkModeToggle.addEventListener('click', toggleDarkMode);

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
            <div id="details-container" class="mt-8 hidden"></div>
        `;
        resultContainer.classList.remove('hidden');
        
        // Trigger reflow to ensure the animation runs
        resultContainer.offsetHeight;
        
        // Add animation classes
        resultContainer.firstElementChild.classList.remove('opacity-0', 'translate-y-4');

        // Add event listener for the "More Details" button
        document.getElementById('more-details-btn').addEventListener('click', fetchMoreDetails);
    }

    async function fetchMoreDetails(e) {
        const id = e.target.dataset.id;
        const mediaType = e.target.dataset.mediaType;
        const detailsContainer = document.getElementById('details-container');

        try {
            const response = await fetch(`/details/${id}?media_type=${mediaType}`);
            if (response.ok) {
                const data = await response.json();
                displayMoreDetails(data, detailsContainer);
            } else {
                throw new Error('Failed to fetch details');
            }
        } catch (error) {
            console.error('Error fetching more details:', error);
            detailsContainer.innerHTML = '<p class="text-red-500">Daha fazla bilgi yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }

    function displayMoreDetails(data, container) {
        const releaseDate = data.release_date || data.first_air_date || 'N/A';
        const runtime = data.runtime ? `${data.runtime} dakika` : (data.episode_run_time ? `Bölüm başına ${data.episode_run_time[0]} dakika` : 'N/A');
        const status = data.status || 'N/A';
        const productionCompanies = data.production_companies ? data.production_companies.map(company => company.name).join(', ') : 'N/A';

        container.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 animate-fade-in">
                <h3 class="text-xl font-bold text-accent mb-4">Ek Bilgiler</h3>
                <p><span class="font-bold">Yayın Tarihi:</span> ${releaseDate}</p>
                <p><span class="font-bold">Süre:</span> ${runtime}</p>
                <p><span class="font-bold">Durum:</span> ${status}</p>
                <p><span class="font-bold">Yapım Şirketleri:</span> ${productionCompanies}</p>
            </div>
        `;
        container.classList.remove('hidden');
    }

    function displayError(message) {
        resultContainer.innerHTML = `
            <div class="bg-red-900 border border-red-400 text-red-100 px-4 py-3 rounded relative opacity-0 transform translate-y-4" role="alert">
                <strong class="font-bold">Hata:</strong>
                <span class="block sm:inline">${message}</span>
            </div>
        `;
        resultContainer.classList.remove('hidden');
        
        // Trigger reflow to ensure the animation runs
        resultContainer.offsetHeight;
        
        // Add animation classes
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
                displayAutocompleteSuggestions(suggestions);
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

    function toggleDarkMode() {
        document.body.classList.toggle('light-mode');
        const icon = darkModeToggle.querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
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

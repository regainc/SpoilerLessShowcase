document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultContainer = document.getElementById('result-container');
    const loadingSpinner = document.getElementById('loading-spinner');

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

        resultContainer.innerHTML = `
            <div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div class="md:flex">
                    <div class="md:flex-shrink-0">
                        <img src="${imageSrc}" alt="${title}" class="h-48 w-full object-cover md:h-full md:w-48" onerror="this.onerror=null; this.src='/static/img/placeholder.svg'; displayImageError();">
                    </div>
                    <div class="p-8">
                        <div class="uppercase tracking-wide text-sm text-yellow-400 font-semibold">${type}</div>
                        <h2 class="mt-1 text-2xl font-bold text-white leading-tight">${title}</h2>
                        <p class="mt-2 text-gray-300">${overview}</p>
                        <div class="mt-4">
                            <span class="text-yellow-400 font-bold">Rating:</span>
                            <span class="text-white">${rating}</span>
                        </div>
                        <div class="mt-2">
                            <span class="text-yellow-400 font-bold">Genres:</span>
                            <span class="text-white">${genres}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resultContainer.classList.remove('hidden');
    }

    function displayError(message) {
        resultContainer.innerHTML = `
            <div class="bg-red-900 border border-red-400 text-red-100 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error:</strong>
                <span class="block sm:inline">${message}</span>
            </div>
        `;
        resultContainer.classList.remove('hidden');
    }

    function displayImageError() {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Görsel yüklenemedi. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        errorMessage.classList.add('text-red-400', 'text-sm', 'mt-2');
        resultContainer.querySelector('img').insertAdjacentElement('afterend', errorMessage);
    }
});

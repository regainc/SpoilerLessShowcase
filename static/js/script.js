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

        resultContainer.innerHTML = `
            <div class="flex flex-col md:flex-row">
                <img src="${imageSrc}" alt="${title}" class="w-full md:w-1/3 rounded-lg shadow-lg" onerror="this.onerror=null; this.src='/static/img/placeholder.svg'; displayImageError();">
                <div class="mt-4 md:mt-0 md:ml-6 flex-1">
                    <h2 class="text-2xl font-bold mb-2 text-yellow-400">${title}</h2>
                    <p class="text-gray-300 mb-4">${overview}</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="bg-yellow-400 text-black text-sm font-medium px-2.5 py-0.5 rounded">${type}</span>
                    </div>
                    <div class="flex items-center mb-4">
                        <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <p class="ml-2 text-sm font-bold text-yellow-400">${rating}</p>
                    </div>
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-yellow-400 mb-2">AI Analizi</h3>
                        <p class="text-gray-300">${data.ai_analysis}</p>
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

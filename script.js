/* DOM Elements */
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const queueList = document.getElementById('queueList');
const audioPlayer = document.getElementById('audioPlayer');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const vinylIcon = document.getElementById('vinylIcon');
const progressBar = document.getElementById('progressBar');
const queueCount = document.getElementById('queueCount');

/* State */
let queue = [];
let isPlaying = false;
let currentTrack = null;

/* Debounce for Search */
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = e.target.value;
        if (query.trim()) {
            searchTracks(query);
        } else {
            searchResults.innerHTML = '<div class="empty-state"><p>Type to find your favorite tracks...</p></div>';
        }
    }, 500);
});

/* Search Function using iTunes API */
async function searchTracks(term) {
    try {
        // iTunes API requires JSONP for cross-origin often, but some endpoints work with CORS.
        // We will try standard fetch first. 
        // Note: 'entity=song' ensures we get music tracks. 'limit=15' limits results.
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15&origin=*`);
        const data = await response.json();
        
        displayResults(data.results);
    } catch (error) {
        console.error('Search failed:', error);
        searchResults.innerHTML = '<div class="empty-state"><p>Error searching tracks. Try again.</p></div>';
    }
}

/* Display Search Results */
function displayResults(tracks) {
    searchResults.innerHTML = '';
    
    if (tracks.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>No results found.</p></div>';
        return;
    }

    tracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'track-item fade-in';
        div.innerHTML = `
            <img src="${track.artworkUrl60}" class="track-img" alt="Art">
            <div class="track-info">
                <div class="track-title">${track.trackName}</div>
                <div class="track-artist">${track.artistName}</div>
            </div>
            <button class="add-btn">+</button>
        `;
        
        div.addEventListener('click', () => {
            addToQueue({
                title: track.trackName,
                artist: track.artistName,
                previewUrl: track.previewUrl,
                artwork: track.artworkUrl100
            });
            // Visual feedback
            const btn = div.querySelector('.add-btn');
            btn.innerHTML = '✓';
            setTimeout(() => { btn.innerHTML = '+'; }, 1000);
        });

        searchResults.appendChild(div);
    });
}

/* Queue Management */
function addToQueue(track) {
    queue.push(track);
    updateQueueUI();
    
    // If nothing is playing, start immediately
    if (!isPlaying) {
        playNext();
    }
}

function updateQueueUI() {
    queueCount.textContent = `${queue.length} tracks`;
    queueList.innerHTML = '';

    if (queue.length === 0) {
        queueList.innerHTML = '<div class="empty-queue-message">Queue is empty. Add some songs!</div>';
        return;
    }

    queue.forEach((track, index) => {
        const div = document.createElement('div');
        div.className = 'queue-item fade-in';
        div.innerHTML = `
            <span class="queue-num">${index + 1}</span>
            <div class="queue-meta">
                <span class="queue-title">${track.title}</span>
                <span class="queue-artist">${track.artist}</span>
            </div>
        `;
        queueList.appendChild(div);
    });
}

/* Playback Logic */
function playNext() {
    if (queue.length === 0) {
        isPlaying = false;
        currentTrack = null;
        resetPlayerUI();
        return;
    }

    const nextTrack = queue.shift(); // Remove first from queue
    currentTrack = nextTrack;
    isPlaying = true;
    updateQueueUI();

    // Start Audio
    audioPlayer.src = nextTrack.previewUrl;
    audioPlayer.play().catch(e => {
        console.log("Autoplay policy might blocked this: ", e);
    });

    // Update UI
    currentTitle.textContent = nextTrack.title;
    currentArtist.textContent = nextTrack.artist;
    vinylIcon.classList.add('spinning');
}

function resetPlayerUI() {
    currentTitle.textContent = "Not Playing";
    currentArtist.textContent = "Waiting for selection...";
    vinylIcon.classList.remove('spinning');
    progressBar.style.width = '0%';
}

/* Audio Events */
audioPlayer.addEventListener('ended', () => {
    playNext();
});

audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${percent}%`;
    }
});

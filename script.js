window.songSortDescending = true;

async function getSongs() {
    // Add you own music fodler here (withtin the project folder)
    let a = await fetch("http://127.0.0.1:3000/NCS/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href);
        }
    }
    return songs;
}

function formatDuration(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '--:--';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

async function createSongBox(songUrl) {
    return new Promise((resolve) => {
        const audio = new Audio(songUrl);
        audio.addEventListener("loadedmetadata", () => {
            const duration = formatDuration(audio.duration);
            let title = decodeURIComponent(songUrl.split('/').pop().replace('.mp3', ''));
            title = title.replace(/^_+/, '');
            // Create songbox element matching index.html template
            const songbox = document.createElement("div");
            songbox.className = "songbox";
            // We'll set data-index later in renderSongs
            songbox.innerHTML = `
                <div class="songtitle">
                    <svg xmlns="http://www.w3.org/2000/svg" data-encore-id="icon" width="32px" role="img" aria-hidden="true" class="e-9921-icon e-9921-baseline" viewBox="0 0 24 24">
                        <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
                    </svg>
                    <div class="songtitletext">${title}</div>
                </div>
                <div class="songduration">${duration}</div>
            `;
            resolve(songbox);
        });
        // Fallback for files that may not load metadata
        audio.addEventListener("error", () => {
            let title = decodeURIComponent(songUrl.split('/').pop().replace('.mp3', ''));
            title = title.replace(/^_+/, '');
            const songbox = document.createElement("div");
            songbox.className = "songbox";
            // We'll set data-index later in renderSongs
            songbox.innerHTML = `
                <div class="songtitle">
                    <svg xmlns="http://www.w3.org/2000/svg" data-encore-id="icon" width="32px" role="img" aria-hidden="true" class="e-9921-icon e-9921-baseline" viewBox="0 0 24 24">
                        <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
                    </svg>
                    <div class="songtitletext">${title}</div>
                </div>
                <div class="songduration">--:--</div>
            `;
            resolve(songbox);
        });
    });
}

async function renderSongs() {
    let songs = await getSongs();
    // Sort songs alphabetically by title (after removing leading underscores and decoding)
    songs = songs.sort((a, b) => {
        let titleA = decodeURIComponent(a.split('/').pop().replace('.mp3', ''));
        titleA = titleA.replace(/^_+/, '');
        let titleB = decodeURIComponent(b.split('/').pop().replace('.mp3', ''));
        titleB = titleB.replace(/^_+/, '');
        return titleA.localeCompare(titleB);
    });
    if(window.songSortDescending){
        songs.reverse();
    }
    sortedSongs = songs;
    const songsSection = document.querySelector(".songssection");
    // Find the last static element (songseparatorline) and insert after it
    const separator = songsSection.querySelector('.songseparatorline');
    // Remove any previously generated songboxes (optional, if you want to refresh)
    let next = separator.nextElementSibling;
    while (next && next.classList.contains('songbox')) {
        let toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
    }
    // Add new songboxes after the separator
    let songboxes = [];
    for (let idx = 0; idx < songs.length; idx++) {
        const songUrl = songs[idx];
        const songbox = await createSongBox(songUrl);
        songbox.setAttribute('data-index', idx);
        separator.parentNode.insertBefore(songbox, separator.nextElementSibling);
        songboxes.push(songbox);
    }
    // Attach listeners with correct index
    songboxes.forEach((box, idx) => {
        box.onclick = function() {
            playSongAtIndex(idx);
        };
    });
    setupPlaybarControls();
    // Play first song but keep it paused
    if (sortedSongs.length > 0) {
        playSongAtIndex(0);
        if (currentAudio) {
            currentAudio.pause();
        }
    }
}

function setupPlaybarControls() {
    const playBtn = document.getElementById('play');
    const playBtnImg = playBtn ? playBtn.querySelector('img') : null;
    const prevBtn = document.querySelector('.previousbutton');
    const nextBtn = document.querySelector('.nextbutton');
    function updatePlayPauseIcon() {
        if (!playBtnImg) return;
        if (currentAudio && !currentAudio.paused) {
            playBtnImg.src = 'Images/pause.svg';
        } else {
            playBtnImg.src = 'Images/play2.svg';
        }
    }
    if (playBtn) {
        playBtn.onclick = function() {
            if (!currentAudio) return;
            if (currentAudio.paused) {
                currentAudio.play();
            } else {
                currentAudio.pause();
            }
            updatePlayPauseIcon();
        };
    }
    if (prevBtn) {
        prevBtn.onclick = function() {
            if (currentSongIndex < sortedSongs.length - 1) {
                playSongAtIndex(currentSongIndex + 1);
                updatePlayPauseIcon();
            }
        };
    }
    if (nextBtn) {
        nextBtn.onclick = function() {
            if (currentSongIndex > 0) {
                playSongAtIndex(currentSongIndex - 1);
                updatePlayPauseIcon();
            }
        };
    }
    // Listen for play/pause events to update icon
    if (currentAudio) {
        currentAudio.addEventListener('play', updatePlayPauseIcon);
        currentAudio.addEventListener('pause', updatePlayPauseIcon);
        currentAudio.addEventListener('ended', updatePlayPauseIcon);
    }
    updatePlayPauseIcon();
}

let currentAudio = null;
let currentSongIndex = -1;
let sortedSongs = [];

function updatePlaybar(title) {
    const playbarTitle = document.querySelector('.playbarsongname');
    // Use a span for scrolling text
    playbarTitle.innerHTML = `<span class="playbar-title-inner">${title}</span>`;
    const inner = playbarTitle.querySelector('.playbar-title-inner');
    playbarTitle.classList.remove('marquee');
    inner.classList.remove('marquee');
    setTimeout(() => {
        if (inner.scrollWidth > playbarTitle.clientWidth) {
            inner.classList.add('marquee');
        }
    }, 50);
}

function playSongAtIndex(idx) {
    if (sortedSongs.length === 0 || idx < 0 || idx >= sortedSongs.length) return;
    const songUrl = sortedSongs[idx];
    let title = decodeURIComponent(songUrl.split('/').pop().replace('.mp3', ''));
    title = title.replace(/^_+/, '');
    updatePlaybar(title);
    // Remove playing and force-hover from all songboxes
    document.querySelectorAll('.songbox.playing, .songbox.force-hover').forEach(box => {
        box.classList.remove('playing');
        box.classList.remove('force-hover');
    });
    // Add playing and force-hover class to the current songbox
    const activeBox = document.querySelector(`.songbox[data-index="${idx}"]`);
    if (activeBox) {
        activeBox.classList.add('playing');
        activeBox.classList.add('force-hover');
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.removeEventListener('timeupdate', updateSeekbar);
        currentAudio.removeEventListener('loadedmetadata', setTotalDuration);
    }
    currentAudio = new Audio(songUrl);
    currentAudio.addEventListener('timeupdate', updateSeekbar);
    currentAudio.addEventListener('loadedmetadata', setTotalDuration);
    currentAudio.addEventListener('play', function() {
        const playBtn = document.getElementById('play');
        const playBtnImg = playBtn ? playBtn.querySelector('img') : null;
        if (playBtnImg) playBtnImg.src = 'Images/pause.svg';
    });
    currentAudio.addEventListener('pause', function() {
        const playBtn = document.getElementById('play');
        const playBtnImg = playBtn ? playBtn.querySelector('img') : null;
        if (playBtnImg) playBtnImg.src = 'Images/play2.svg';
    });
    currentAudio.play();
    currentSongIndex = idx;
}

function updateSeekbar() {
    const seekbar = document.querySelector('.seekbar');
    const circle = seekbar.querySelector('.circle');
    const currentDuration = document.querySelector('.currentduration');
    let progressFill = seekbar.querySelector('.progress-fill');
    if (!progressFill) {
        progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        seekbar.insertBefore(progressFill, circle);
    }
    if (!currentAudio || !seekbar || !circle) return;
    const percent = currentAudio.currentTime / currentAudio.duration;
    const barWidth = seekbar.offsetWidth;
    circle.style.left = `${percent * barWidth}px`;
    currentDuration.textContent = formatDuration(currentAudio.currentTime);
    progressFill.style.width = `${percent * barWidth}px`;
}

function setTotalDuration() {
    const totalDuration = document.querySelector('.totalduration');
    if (currentAudio && totalDuration) {
        totalDuration.textContent = formatDuration(currentAudio.duration);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const sortBtn = document.getElementById('sortTitleBtn');
    const sortArrow = document.getElementById('sortArrow');
    const seekbar = document.querySelector('.seekbar');
    if(sortBtn){
        sortBtn.addEventListener('click', function(){
            window.songSortDescending = !window.songSortDescending;
            sortArrow.innerHTML = window.songSortDescending ? '&#9660;' : '&#9650;';
            renderSongs();
        });
    }
    if (seekbar) {
        seekbar.addEventListener('click', function(e) {
            if (!currentAudio || !currentAudio.duration) return;
            const rect = seekbar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / seekbar.offsetWidth;
            currentAudio.currentTime = percent * currentAudio.duration;
        });
    }
    setupPlaybarControls();

    // Volume bar logic
    const volumebar = document.querySelector('.volumebar');
    const volumeCircle = volumebar ? volumebar.querySelector('.circle') : null;
    let volumeFill = volumebar ? volumebar.querySelector('.volume-fill') : null;
    const volumeIcon = document.querySelector('.volumeicon img');
    let isMuted = false;
    if (volumebar && volumeCircle && volumeIcon) {
        // Add volume fill if not present
        if (!volumeFill) {
            volumeFill = document.createElement('div');
            volumeFill.className = 'volume-fill';
            volumebar.insertBefore(volumeFill, volumeCircle);
        }
        // Set initial volume
        let volume = 1;
        if (currentAudio) currentAudio.volume = volume;
        // Set initial position
        function updateVolumeUI(vol) {
            const barWidth = volumebar.offsetWidth;
            volumeCircle.style.left = `${vol * barWidth}px`;
            volumeFill.style.width = `${vol * barWidth}px`;
            volumeIcon.style.opacity = isMuted ? '0.5' : '1';
        }
        updateVolumeUI(volume);
        // Click to set volume
        volumebar.addEventListener('click', function(e) {
            const rect = volumebar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.max(0, Math.min(1, x / volumebar.offsetWidth));
            if (currentAudio) {
                currentAudio.volume = percent;
                if (percent === 0) {
                    isMuted = true;
                    currentAudio.muted = true;
                } else {
                    isMuted = false;
                    currentAudio.muted = false;
                }
            }
            updateVolumeUI(percent);
        });
        // Mute/unmute on icon click
        volumeIcon.style.cursor = 'pointer';
        volumeIcon.addEventListener('click', function() {
            isMuted = !isMuted;
            if (currentAudio) {
                currentAudio.muted = isMuted;
            }
            updateVolumeUI(currentAudio ? currentAudio.volume : volume);
        });
        // Update UI when song changes
        function attachVolumeToAudio() {
            if (currentAudio) {
                currentAudio.volume = volume;
                currentAudio.muted = isMuted;
                currentAudio.addEventListener('volumechange', function() {
                    updateVolumeUI(currentAudio.volume);
                });
            }
        }
        // Attach on song change
        const origPlaySongAtIndex = window.playSongAtIndex;
        window.playSongAtIndex = function(idx) {
            origPlaySongAtIndex(idx);
            attachVolumeToAudio();
        };
        attachVolumeToAudio();
    }
});

renderSongs();


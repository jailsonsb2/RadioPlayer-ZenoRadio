const RADIO_NAME = 'Your Radio';

// Change Azuracast Stream URL Here, .
const URL_STREAMING = 'https://azuracp.web-radios.eu/listen/treloparea/stream';

//API URL Azuracast Now Playing
const API_URL = 'https://azuracp.web-radios.eu/api/nowplaying/2';

// Variable to control history display: true = display / false = hides
let showHistory = true; 

window.onload = function () {
    var page = new Page;
    page.changeTitlePage();
    page.setVolume();

    var radioName = document.getElementById('radioName');
    if (radioName) radioName.textContent = RADIO_NAME;

    var player = new Player();
    player.play();

    getStreamingData();
    // Interval to get streaming data in miliseconds
    setInterval(function () {
        getStreamingData();
    }, 10000);

    // A altura da capa é responsabilidade do CSS (aspect-ratio).

    localStorage.removeItem('musicHistory');
}

// Cache de letras: guarda a própria Promise (não só o resultado) para que
// duas chamadas quase simultâneas para a mesma música reaproveitem a mesma
// requisição em vez de martelar as APIs de novo.
var lyricsCache = {};

function fetchLyrics(currentArtist, currentSong) {
    var cacheKey = (currentArtist + ' - ' + currentSong).toLowerCase();
    if (lyricsCache[cacheKey]) {
        return lyricsCache[cacheKey];
    }

    var promise = (async function () {
        // A API do Vagalume foi descontinuada — busca em lyrics.ovh e,
        // se não encontrar, no LRCLIB (nenhuma exige chave de API).
        var lyric = null;
        try {
            var response = await fetch('https://api.lyrics.ovh/v1/' + encodeURIComponent(currentArtist) + '/' + encodeURIComponent(currentSong));
            var data = await response.json();
            if (data && data.lyrics) lyric = data.lyrics;
        } catch (error) {}

        if (!lyric) {
            try {
                var responseGet = await fetch('https://lrclib.net/api/get?artist_name=' + encodeURIComponent(currentArtist) + '&track_name=' + encodeURIComponent(currentSong));
                if (responseGet.ok) {
                    var dataGet = await responseGet.json();
                    lyric = dataGet.plainLyrics || dataGet.syncedLyrics || null;
                }
            } catch (error) {}
        }

        if (!lyric) {
            try {
                var responseSearch = await fetch('https://lrclib.net/api/search?track_name=' + encodeURIComponent(currentSong) + '&artist_name=' + encodeURIComponent(currentArtist));
                if (responseSearch.ok) {
                    var results = await responseSearch.json();
                    var hit = Array.isArray(results) && results.find(function (r) { return r.plainLyrics || r.syncedLyrics; });
                    if (hit) lyric = hit.plainLyrics || hit.syncedLyrics;
                }
            } catch (error) {}
        }

        return lyric;
    })();

    lyricsCache[cacheKey] = promise;
    return promise;
}

// DOM control
class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');
    
            if (song !== currentSong.innerHTML) {
                // Animate transition
                currentSong.className = 'animated flipInY text-uppercase';
                currentSong.innerHTML = song;
    
                currentArtist.className = 'animated flipInY text-capitalize';
                currentArtist.innerHTML = artist;
    
                // Refresh modal title
                document.getElementById('lyricsSong').innerHTML = song + ' - ' + artist;
    
                // Remove animation classes
                setTimeout(function () {
                    currentSong.className = 'text-uppercase';
                    currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        }

        this.refreshCover = async function () {
        
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Falha ao obter dados da API');
                }
                
                const data = await response.json();
                const nowPlaying = data.now_playing;
        
                const song = nowPlaying.song.title;
                const artist = nowPlaying.song.artist;
                const artwork = nowPlaying.song.art;
        
                var coverArt = document.getElementById('currentCoverArt');
                var coverBackground = document.getElementById('bgCover');
        
                coverArt.style.backgroundImage = 'url(' + artwork + ')';
                coverArt.className = 'animated bounceInLeft';
        
                coverBackground.style.backgroundImage = 'url(' + artwork + ')';
        
                setTimeout(function () {
                    coverArt.className = '';
                }, 2000);
        
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: song,
                        artist: artist,
                        artwork: [{
                            src: artwork,
                            sizes: '96x96',
                            type: 'image/png'
                        }]
                    });
                }
            } catch (error) {
                console.error('Ocorreu um erro:', error);
            }
        }

        // O AzuraCast entrega o histórico completo (com capas) no próprio
        // /nowplaying — monta os cards dinamicamente, sem depender de
        // placeholders fixos no HTML nem de buscas no Deezer.
        this.refreshHistoric = function (songHistory) {
            var container = document.getElementById('historicSong');
            if (!container) return;

            var items = (songHistory || []).slice(0, 4);
            if (items.length === 0) return;

            var fragment = document.createDocumentFragment();
            items.forEach(function (item) {
                var song = item.song || {};

                var article = document.createElement('article');
                article.className = 'animated slideInRight';

                var cover = document.createElement('div');
                cover.className = 'cover-historic';
                if (song.art) cover.style.backgroundImage = 'url(' + song.art + ')';

                var info = document.createElement('div');
                info.className = 'music-info';

                var titleElement = document.createElement('div');
                titleElement.className = 'song';
                titleElement.textContent = song.title || song.text || '';

                var artistElement = document.createElement('div');
                artistElement.className = 'artist';
                artistElement.textContent = song.artist || '';

                info.appendChild(titleElement);
                info.appendChild(artistElement);
                article.appendChild(cover);
                article.appendChild(info);
                fragment.appendChild(article);
            });

            container.innerHTML = '';
            container.appendChild(fragment);

            setTimeout(function () {
                container.querySelectorAll('article').forEach(function (article) {
                    article.classList.remove('animated', 'slideInRight');
                });
            }, 2000);
        };

        // Próxima música da fila (playing_next) — exclusividade do AzuraCast
        this.refreshNextSong = function (playingNext) {
            var box = document.getElementById('upNext');
            if (!box) return;

            var song = playingNext && playingNext.song;
            if (!song || !song.title) {
                box.classList.add('hidden');
                return;
            }

            box.classList.remove('hidden');
            document.getElementById('nextSong').textContent = song.title;
            document.getElementById('nextArtist').textContent = song.artist || '';

            var cover = document.getElementById('nextCover');
            if (song.art) cover.style.backgroundImage = 'url(' + song.art + ')';
        };
        
        this.changeVolumeIndicator = function (volume) {
            document.getElementById('volIndicator').innerHTML = volume;

            if (typeof (Storage) !== 'undefined') {
                localStorage.setItem('volume', volume);
            }
        };

        this.setVolume = function () {
            if (typeof (Storage) !== 'undefined') {
                var volumeLocalStorage = (!localStorage.getItem('volume')) ? 80 : localStorage.getItem('volume');
                document.getElementById('volume').value = volumeLocalStorage;
                document.getElementById('volIndicator').innerHTML = volumeLocalStorage;
            }
        };

        this.refreshLyric = async function (currentSong, currentArtist) {
            var lyric = await fetchLyrics(currentArtist, currentSong);

            var openLyric = document.getElementsByClassName('lyrics')[0];
            if (lyric) {
                document.getElementById('lyric').innerHTML = lyric.replace(/\n/g, '<br />');
                openLyric.style.opacity = "1";
                openLyric.setAttribute('data-toggle', 'modal');
            } else {
                openLyric.style.opacity = "0.3";
                openLyric.removeAttribute('data-toggle');

                var modalLyric = document.getElementById('modalLyrics');
                modalLyric.style.display = "none";
                modalLyric.setAttribute('aria-hidden', 'true');
                (document.getElementsByClassName('modal-backdrop')[0]) ? document.getElementsByClassName('modal-backdrop')[0].remove() : '';
            }
        };
    }
}

function getStreamingData() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var data = JSON.parse(this.responseText);
            var page = new Page();

            // Extrai as informações relevantes para a música atual
            var currentSong = data.now_playing.song.title;
            var currentArtist = data.now_playing.song.artist;

            // Atualiza o título da página
            document.title = currentSong + ' - ' + currentArtist + ' | ' + RADIO_NAME;

            // Só reconstrói a interface quando a música de fato muda,
            // para o polling de 10s não causar flicker
            if (document.getElementById('currentSong').innerHTML !== currentSong) {
                page.refreshCover(currentSong, currentArtist);
                page.refreshCurrentSong(currentSong, currentArtist);
                page.refreshLyric(currentSong, currentArtist);
                page.refreshHistoric(data.song_history);
                page.refreshNextSong(data.playing_next);
            }

            if (showHistory) {
                // Atualizar a interface do histórico
                updateHistoryUI();

            }


        }
    };

    // URL da API do AzuraCast
    xhttp.open('GET', API_URL, true);
    xhttp.send();
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
      historicElement.classList.remove('hidden'); // Show history
    } else {
      historicElement.classList.add('hidden'); // Hide history
    }
}

//####################################### AUDIO #######################################


// Variável global para armazenar as músicas
var audio = new Audio(URL_STREAMING);

// Player control
class Player {
    constructor() {
        this.play = function () {
            var playPromise = audio.play();
            if (playPromise !== undefined) {
                // Autoplay bloqueado pelo navegador até a primeira interação:
                // não é um erro, o usuário dá o play manualmente.
                playPromise.catch(function () {});
            }

            var defaultVolume = document.getElementById('volume').value;

            if (typeof (Storage) !== 'undefined') {
                if (localStorage.getItem('volume') !== null) {
                    audio.volume = intToDecimal(localStorage.getItem('volume'));
                } else {
                    audio.volume = intToDecimal(defaultVolume);
                }
            } else {
                audio.volume = intToDecimal(defaultVolume);
            }
            document.getElementById('volIndicator').innerHTML = defaultVolume;
        };

        this.pause = function () {
            audio.pause();
        };
    }
}

function setPlayerIcon(iconClass, label) {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    botao.className = iconClass;
    bplay.firstChild.data = label;
}

// On play, change the button to pause
audio.onplay = function () {
    setPlayerIcon('fa fa-pause', 'PAUSAR');
}

// On pause, change the button to play (a menos que estejamos exibindo o
// spinner de reconexão, que também pausa o áudio momentaneamente)
audio.onpause = function () {
    if (!isIntentionalPause && reconnectAttempts > 0) return;
    setPlayerIcon('fa fa-play', 'PLAY');
}

// Enquanto o áudio estiver em buffer, mostra o spinner girando
audio.addEventListener('waiting', function () {
    if (!audio.paused) setPlayerIcon('fa fa-spinner fa-spin', 'CARREGANDO');
});

// Áudio voltou a fluir de verdade: reseta as tentativas de reconexão e
// habilita o watchdog (a partir daqui uma queda deve reconectar sozinha)
audio.addEventListener('playing', function () {
    isIntentionalPause = false;
    reconnectAttempts = 0;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    setPlayerIcon('fa fa-pause', 'PAUSAR');
});

// Unmute when volume changed
audio.onvolumechange = function () {
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

// Reconexão automática (rede instável) antes de incomodar o usuário com o
// confirm() de "Stream Down" — só aparece se 5 tentativas seguidas falharem.
// Começa true: antes da primeira reprodução real não há o que reconectar
// (ex.: stream fora do ar no carregamento não deve gerar loop nem confirm).
let isIntentionalPause = true;
let reconnectAttempts = 0;
let reconnectTimeout = null;

function handleConnectionDrop() {
    if (isIntentionalPause) return;

    if (reconnectTimeout) clearTimeout(reconnectTimeout);

    if (reconnectAttempts < 5) {
        reconnectAttempts++;
        setPlayerIcon('fa fa-spinner fa-spin', 'RECONECTANDO');
        var delay = reconnectAttempts * 2000;

        reconnectTimeout = setTimeout(function () {
            audio.load();
            var playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(function (e) { console.error('Falha ao reconectar:', e); });
            }
        }, delay);
    } else {
        reconnectAttempts = 0;
        setPlayerIcon('fa fa-play', 'PLAY');

        var confirmacao = confirm('Stream Down / Network Error. \nClick OK to try again.');
        if (confirmacao) {
            window.location.reload();
        }
    }
}

audio.onerror = handleConnectionDrop;
audio.addEventListener('stalled', handleConnectionDrop);

// Fade suave no volume ao dar play/pause, para evitar o "estalo" de áudio
let fadeInterval = null;

function fadeOut(callback) {
    if (fadeInterval) clearInterval(fadeInterval);
    var currentVol = audio.volume;
    var step = currentVol / 15;

    fadeInterval = setInterval(function () {
        currentVol -= step;
        if (currentVol <= 0.05) {
            audio.volume = 0;
            clearInterval(fadeInterval);
            fadeInterval = null;
            if (callback) callback();
        } else {
            audio.volume = currentVol;
        }
    }, 30);
}

function fadeIn() {
    if (fadeInterval) clearInterval(fadeInterval);
    var targetVol = intToDecimal(localStorage.getItem('volume') || document.getElementById('volume').value || 80);
    audio.volume = 0;
    var step = targetVol / 15;

    fadeInterval = setInterval(function () {
        var newVol = audio.volume + step;
        if (newVol >= targetVol) {
            audio.volume = targetVol;
            clearInterval(fadeInterval);
            fadeInterval = null;
        } else {
            audio.volume = newVol;
        }
    }, 30);
}

document.getElementById('volume').oninput = function () {
    audio.volume = intToDecimal(this.value);

    var page = new Page();
    page.changeVolumeIndicator(this.value);
}

function togglePlay() {
    if (!audio.paused) {
        isIntentionalPause = true;
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        fadeOut(function () {
            audio.pause();
        });
    } else {
        isIntentionalPause = false;
        fadeIn();
        audio.load();
        audio.play();
    }
}

function volumeUp() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0 && audio.volume < 1) {
            audio.volume = (vol + .01).toFixed(2);
        }
    }
}

function volumeDown() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0.01 && audio.volume <= 1) {
            audio.volume = (vol - .01).toFixed(2);
        }
    }
}

function mute() {
    if (!audio.muted) {
        document.getElementById('volIndicator').innerHTML = 0;
        document.getElementById('volume').value = 0;
        audio.volume = 0;
        audio.muted = true;
    } else {
        var localVolume = localStorage.getItem('volume');
        document.getElementById('volIndicator').innerHTML = localVolume;
        document.getElementById('volume').value = localVolume;
        audio.volume = intToDecimal(localVolume);
        audio.muted = false;
    }
}

document.addEventListener('keydown', function (event) {
    var key = event.key;
    var slideVolume = document.getElementById('volume');
    var page = new Page();

    switch (key) {
        // Arrow up
        case 'ArrowUp':
            volumeUp();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Arrow down
        case 'ArrowDown':
            volumeDown();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Spacebar (preventDefault evita rolar a página junto)
        case ' ':
        case 'Spacebar':
            event.preventDefault();
            togglePlay();
            break;
        // P
        case 'p':
        case 'P':
            togglePlay();
            break;
        // M
        case 'm':
        case 'M':
            mute();
            break;
        // Numeric keys 0-9
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            var volumeValue = parseInt(key);
            audio.volume = volumeValue / 10;
            slideVolume.value = volumeValue * 10;
            page.changeVolumeIndicator(volumeValue * 10);
            break;
    }
});


function intToDecimal(vol) {
    return vol / 100;
}

function decimalToInt(vol) {
    return vol * 100;
}

// Botão de instalar como PWA: só aparece quando o navegador sinaliza que a
// instalação está disponível (manifest + service worker já registrados).
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    var installBtn = document.getElementById('installPwaBtn');
    if (installBtn) installBtn.hidden = false;
});

document.addEventListener('DOMContentLoaded', function () {
    var installBtn = document.getElementById('installPwaBtn');
    if (!installBtn) return;

    installBtn.addEventListener('click', function () {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function () {
            deferredInstallPrompt = null;
            installBtn.hidden = true;
        });
    });

    window.addEventListener('appinstalled', function () {
        installBtn.hidden = true;
    });
});

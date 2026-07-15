const RADIO_NAME = 'Jailson Webradio';

// Change Stream URL Here, Supports, ICECAST, ZENO, SHOUTCAST, RADIOJAR and any other stream service.
const URL_STREAMING = 'https://stream.zeno.fm/2p5tpsaurfhvv';

// You can find the mount point in the Broadcast Settings.
// To generate the Zeno Radio API link from the mount point,
// exclude the '/source' part and append the remaining mount point to the base URL of the API.
// For example, if the mount point is 'yn65fsaurfhvv/source',
// the API link will be 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'.

const url = 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv';

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

    // Os dados da música tocando agora chegam via SSE (connectToEventSource),
    // não por polling. A altura da capa é responsabilidade do CSS (aspect-ratio).

    localStorage.removeItem('musicHistory');
}

// Cache de letras: guarda a própria Promise (não só o resultado) para que
// duas chamadas quase simultâneas para a mesma música (SSE + polling)
// reaproveitem a mesma requisição em vez de martelar as APIs de novo.
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
        };

        // Função para atualizar a capa
        this.refreshCover = function (song = '', artist) {
            // Criação da tag de script para fazer a requisição JSONP à API do Deezer
            const script = document.createElement('script');
            script.src = `https://api.deezer.com/search?q=${encodeURIComponent(artist + ' ' + song)}&output=jsonp&callback=handleDeezerResponse`;
            document.body.appendChild(script);
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

// Função para lidar com a conexão de eventos
function connectToEventSource(url) {
    // Criar uma nova instância de EventSource com a URL fornecida
    const eventSource = new EventSource(url);

    // Adicionar um ouvinte para o evento 'message'
    eventSource.addEventListener('message', function(event) {
        // Chamar a função para tratar os dados recebidos, passando a URL também
        processData(event.data, url);
    });

    // Adicionar um ouvinte para o evento 'error'
    eventSource.addEventListener('error', function(event) {
        console.error('Erro na conexão de eventos:', event);
        // Tentar reconectar após um intervalo de tempo
        setTimeout(function() {
            connectToEventSource(url);
        }, 1000);
    });
}

// Função para tratar os dados recebidos
function processData(data) {
    // Parse JSON
    const parsedData = JSON.parse(data);
    
    // Verificar se a mensagem é sobre a música
    if (parsedData.streamTitle) {
        // Extrair o título da música e o artista
        let artist, song;
        const streamTitle = parsedData.streamTitle;

        if (streamTitle.includes('-')) {
            [artist, song] = streamTitle.split(' - ');
        } else {
            // Se não houver "-" na string, consideramos que o título é apenas o nome da música
            artist = '';
            song = streamTitle;
        }

        // Criar o objeto com os dados formatados
        const formattedData = {
            currentSong: song.trim(),
            currentArtist: artist.trim()
        };

        // Converter o objeto em JSON
        const jsonData = JSON.stringify(formattedData);

        // Chamar a função getStreamingData com os dados formatados e a URL
        getStreamingData(jsonData);
    } else {
        console.log('Mensagem recebida:', parsedData);
    }
}

// Iniciar a conexão com a API
connectToEventSource(url);

// Define a função de manipulação da resposta da API do Deezer no escopo global.
// O JSONP só passa `data` — título/artista atuais vêm do DOM.
function handleDeezerResponse(data) {
    var coverArt = document.getElementById('currentCoverArt');
    var coverBackground = document.getElementById('bgCover');

    var hasResult = data && data.data && data.data.length > 0;
    // Buscar o Cover pelo nome da música (artist.picture_big buscaria pelo artista)
    var artworkUrl = hasResult ? data.data[0].album.cover_big : 'img/cover.png';

    coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
    coverArt.className = 'animated bounceInLeft';
    coverBackground.style.backgroundImage = 'url(' + artworkUrl + ')';

    setTimeout(function () {
        coverArt.className = '';
    }, 2000);

    if ('mediaSession' in navigator) {
        var songTitle = document.getElementById('currentSong').textContent;
        // O ICY é lei: o Deezer só fornece a capa — o artista exibido (na
        // tela e na tela de bloqueio) é sempre o que a rádio transmitiu
        var artistName = document.getElementById('currentArtist').textContent;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: songTitle,
            artist: artistName,
            artwork: ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'].map(function (size) {
                return { src: artworkUrl, sizes: size, type: 'image/png' };
            })
        });
    }
}

function getStreamingData(data) {

    console.log("Conteúdo dos dados recebidos:", data);
    // Parse JSON
    var jsonData = JSON.parse(data);

    var page = new Page();

    // Formatar caracteres para UTF-8
    let song = jsonData.currentSong.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
    let artist = jsonData.currentArtist.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');

    // Mudar o título
    document.title = song + ' - ' + artist + ' | ' + RADIO_NAME;

    page.refreshCover(song, artist);
    page.refreshCurrentSong(song, artist);
    page.refreshLyric(song, artist);

    if (showHistory) {

        // Verificar se a música é diferente da última atualizada
        if (musicHistory.length === 0 || (musicHistory[0].song !== song)) {
            // Atualizar o histórico com a nova música
            updateMusicHistory(artist, song);
        }

        // Atualizar a interface do histórico
        updateHistoryUI();

    }
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
      historicElement.classList.remove('hidden'); // Show history
    } else {
      historicElement.classList.add('hidden'); // Hide history
    }
}

// Variável global para armazenar o histórico das duas últimas músicas
var musicHistory = [];

// Função para atualizar o histórico das duas últimas músicas
function updateMusicHistory(artist, song) {
    // Adicionar a nova música no início do histórico
    musicHistory.unshift({ artist: artist, song: song });

    // Manter apenas as duas últimas músicas no histórico
    if (musicHistory.length > 4) {
        musicHistory.pop(); // Remove a música mais antiga do histórico
    }

    // Chamar a função para exibir o histórico atualizado
    displayHistory();
}


function displayHistory() {
    var $historicDiv = document.querySelectorAll('#historicSong article');
    var $songName = document.querySelectorAll('#historicSong article .music-info .song');
    var $artistName = document.querySelectorAll('#historicSong article .music-info .artist');

    // Exibir as duas últimas músicas no histórico, começando do índice 1 para excluir a música atual
    for (var i = 1; i < musicHistory.length && i < 3; i++) {
        $songName[i - 1].innerHTML = musicHistory[i].song;
        $artistName[i - 1].innerHTML = musicHistory[i].artist;

        // Chamar a função para buscar a capa da música na API do Deezer
        refreshCoverForHistory(musicHistory[i].song, musicHistory[i].artist, i - 1);

        // Adicionar classe para animação
        $historicDiv[i - 1].classList.add('animated');
        $historicDiv[i - 1].classList.add('slideInRight');
    }

    // Remover classes de animação após 2 segundos
    setTimeout(function () {
        for (var j = 0; j < 2; j++) {
            $historicDiv[j].classList.remove('animated');
            $historicDiv[j].classList.remove('slideInRight');
        }
    }, 2000);
}

// Função para atualizar a capa da música no histórico
function refreshCoverForHistory(song, artist, index) {
    // Criação da tag de script para fazer a requisição JSONP à API do Deezer
    const script = document.createElement('script');
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(artist)} ${encodeURIComponent(song)}&output=jsonp&callback=handleDeezerResponseForHistory_${index}`;
    document.body.appendChild(script);

    // Função de manipulação da resposta da API do Deezer para o histórico de músicas
    window['handleDeezerResponseForHistory_' + index] = function (data) {
        if (data.data && data.data.length > 0) {
            // Atualizar a capa pelo nome do artista
            // var artworkUrl = data.data[0].artist.picture_big;
            // Atualizar a capa pelo nome da música
            var artworkUrl = data.data[0].album.cover_big;
            // Atualizar a capa da música no histórico usando o índice correto
            var $coverArt = document.querySelectorAll('#historicSong article .cover-historic')[index];
            $coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        }
    };
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

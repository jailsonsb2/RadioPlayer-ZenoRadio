
# HTML5 Icecast/Shoutcast/Zeno Radio Full Page Radio Player

* Current song
* Historic of played songs
* Cover art of the current song ([Deezer API](https://developers.deezer.com/login?redirect=/api))
* Lyrics of the current song ([Vagalume API](https://api.vagalume.com.br/docs/))
* Responsive design

## Demo Screenshots

![Demo Screenshot](https://i.imgur.com/QcbLFzn.jpg)

# Documentation.

Open The [Script.js](https://github.com/jailsonsb2/RadioPlayer-ZenoRadio/blob/main/js/script.js) file and edit the lines Below.

```javascript
// RADIO NAME
const RADIO_NAME = 'Your Radio Name';

// Change Stream URL Zeno Radio Here.
const URL_STREAMING = 'https://stream.zeno.fm/yn65fsaurfhvv';

//API URL Zeno Radio Just copy the final segment of your stream URL after the slash (/)
const API_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'


 ```

 ## Change Logo.

 Open The img folder and add your logo named "cover.png"

 ## Zeno Radio API Now Playing.

 Simply copy the mount point or the final segment of your stream URL after the slash (/)

 ## Installation
Just put the files in your server or use Free Hosting



## Free Hosting

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jailsonsb2/RadioPlayer-ZenoRadio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/jailsonsb2/RadioPlayer-ZenoRadio)






 



## Supported Hosting Types
* Icecast / Shoutcast
* Zeno Radio

## Supported API/Data Sources
* Apple Music / Itunes
* Deezer
* Spotify
* Azuracast Now Playing API 

## Keyboard Controls 
* `M` - mute/unmute
* `P` and `space` - play/pause
* `arrow up` and `arrow down` - increase/decrease volume
* `0 to 9` - volume percent


## Feedback

If you have any feedback, please reach out to me at contact@jailson.es


## License

[MIT](https://github.com/gsavio/player-shoutcast-html5/blob/master/LICENSE)

## Credits
* [gsavio/player-shoutcast-html5](https://github.com/gsavio/player-shoutcast-html5)
* [joeyboli/RadioPlayer](https://github.com/joeyboli/RadioPlayer)



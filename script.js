

async function getSongs() {
    let a = await fetch("http://127.0.0.1:3000/MySongs/");
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

async function main() {
    let songs = await getSongs();
    console.log(songs);
    if (songs.length === 0) return;
    var audio = new Audio(songs[2]);
    audio.play().catch(e => console.error("Audio playback failed:", e));
    audio.addEventListener("loadeddata", ()=>{
        let duration = audio.duration;
        console.log(duration)
    })
}
 
document.getElementById("play").addEventListener("click", main);


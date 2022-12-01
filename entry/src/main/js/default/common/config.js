
export default {

    data: {
        battByHour: [],
        battByDay: [],
    },

    SERVER_HTTP: "http://miwatch.corout.in",
    SERVER_HTTPS: "https://miwatch.corout.in",

    USER_AGENT: "miwatch app.player v1.5",
    VERSION: "v1.0",

    BIND_KEY: "bind_flag",
    EXT_MP3: ".mp3",

    battByHour: [],
    battByDay: [],

    zeroPad(nr, base) {
        var  len = (String(base).length - String(nr).length)+1;
        return len > 0? new Array(len).join('0')+nr : nr;
    }
}
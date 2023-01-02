
export default {

    VERSION: "v1.0",

    zeroPad(nr, base) {
        var  len = (String(base).length - String(nr).length)+1;
        return len > 0? new Array(len).join('0')+nr : nr;
    }
}
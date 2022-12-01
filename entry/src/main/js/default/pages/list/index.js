import app from '@system.app';
import file from '@system.file';
import logger from '../../common/logger.js';

export default {
    data: {
        title: 'battery stats',
        filename: '/nand/batt_stat',
        dataList: [],
        loading: true,
        loadingText: "Loading.."
    },

    onInit() {

        this.loadStats();
    },

    loadStats() {

        this.loading = true;
        this.dataList = [];

        file.get({
            uri: this.filename,
            success: (info) => {

                this.loadingText = "len: "+ info.length;

                let len = info.length;
                let size = 200;
                //let pos = info.length > size ? info.length - size : 0;
                let pos = 0;

                file.readArrayBuffer({
                    uri: this.filename,
                    position: pos,
                    length: len,
                    success: (data) => {

                        for (let i = 0; i<info.length; i+=5) {

                            if (data.buffer[i+3] > 0) {

                                let display = "[" + this.zeroPad(data.buffer[i + 0], 10)
                                + ":" + this.zeroPad(data.buffer[i + 1], 10)
                                + ":" + this.zeroPad(data.buffer[i + 2], 10)
                                + "] " + data.buffer[i + 3];

                                this.dataList.push({
                                    uri: "/",
                                    display: display,
                                });
                            }
                        }

                        this.loading = false;
                    },
                    fail: (data, code) => {
                        let error = "code: "+ code +", "+data;
                        this.displayFail(error);
                    }
                });
            },
            fail: (e) => {
                this.displayFail(e);
            }
        });
    },

    zeroPad(nr, base) {
        var  len = (String(base).length - String(nr).length)+1;
        return len > 0? new Array(len).join('0')+nr : nr;
    },

    displayFail(e) {

        this.loadingText = e;
    },

    onTitleClick() {
        this.loadStats();
    },

    onItemClick(e) {
    },

    touchMove(e) {
        if (e.direction == "right") {
            app.terminate();
        }
        if (e.direction == "left") {
            file.delete({ uri: this.filename});
        }
    },
}

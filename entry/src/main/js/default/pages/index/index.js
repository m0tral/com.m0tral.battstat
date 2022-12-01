import app from '@system.app';
import router from '@system.router';
import file from '@system.file';
import logger from '../../common/logger.js';
import config from '../../common/config.js';

export default {
    data: {
        title: 'info',
        filename: '/nand/batt_stat',
        battByHour:[],
        battByDay:[],
        battCharge: 0,
        battLast: 0,
        loading: true,
        loadingText: "Loading..",
        recordCount: 0,
        fileSize: 0,
        firstTime: 0,
        lastTime: 0,
        hourPrev: 0,
    },

    onInit() {
    },

    onShow() {
        this.loadStats();
    },

    loadStats() {

        this.loading = true;

        this.hourPrev = -1;

        this.battByHour = [];
        this.battByDay = [];

        file.get({
            uri: this.filename,
            success: (info) => {

                this.fileSize = info.length;
                this.recordCount = info.length / 5;

                let len = info.length;
                let pos = 0;
                let blockLen = 1000;

                this.readBattData(pos, blockLen, len);
            },
            fail: (e) => {
                this.displayFail(e);
            }
        });
    },

    readBattData(pos, blockLen, totalLen) {

        let left = totalLen - pos;
        let len = left > blockLen ? blockLen : left;

        file.readArrayBuffer({
            uri: this.filename,
            position: pos,
            length: len,
            success: (data) => {

                let hour, min, sec, level, charge;
                let displayFirst;

                for (let i = 0; i < len; i += 5) {
                    hour = data.buffer[i];
                    min = data.buffer[i + 1];
                    sec = data.buffer[i + 2];
                    level = data.buffer[i + 3];
                    charge = data.buffer[i + 4];

                    this.parseBattData(hour, min, sec, level, charge);

//                    this.rawData.push({
//                        hour: hour,
//                        min: min,
//                        sec: sec,
//                        level: level,
//                        charge: charge
//                    });

                    if (i == 0 && pos == 0) {
                        displayFirst = "[" + this.zeroPad(hour, 10)
                        + ":" + this.zeroPad(min, 10)
                        + ":" + this.zeroPad(sec, 10)
                        + "] " + level;

                        this.firstTime = displayFirst;
                    }
                }

                let display = "[" + this.zeroPad(hour, 10)
                + ":" + this.zeroPad(min, 10)
                + ":" + this.zeroPad(sec, 10)
                + "] " + level;

                this.lastTime = display;

                pos += len;
                if (pos == totalLen) {
                    this.loading = false;
                }
                else {
                    this.readBattData(pos, blockLen, totalLen);
                }
            },
            fail: (data, code) => {
                let error = "code: " + code + ", " + data;
                this.displayFail(error);
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

    parseBattData(hour, min, sec, level, charge) {

        let e = {
            hour: hour,
            min: min,
            sec: sec,
            level: level,
            charge: charge
        };

        if (this.battByDay.length == 0) {
            this.battByDay.push(e);
        }
        else if (hour == 0 && min == 0) {
            this.battByDay.push(e);
        }

        if (charge == 1) {
            this.battCharge = e;
        }

        this.battLast = e;

        //let startIndex = this.getLastDayIndex();

        //for (let i=startIndex; i<this.rawData.length; i++) {
        //    let e = this.rawData[i];

        if (this.hourPrev != hour && min == 0) {
            if (this.battByHour.length > 20) this.battByHour.shift();
            this.battByHour.push(e);
            this.hourPrev = hour;
        }
    },

    getLastDayIndex() {
        let index = 0;

        for (let i=0; i<this.rawData.length; i++) {
            let e = this.rawData[i];
            if (e.hour == 0 && e.min == 0)
                index = i;
        }

        return index;
    },

    touchMove(e) {
        if (e.direction == "right") {
            app.terminate();
        }
        else if (e.direction == "left") {
            file.delete({ uri: this.filename});
        }
        else if (e.direction == "up") {
            router.replace({
                uri: "pages/hour/index",
                params: {
                    dataByHour: this.battByHour,
                    dataByDay: this.battByDay,
                    lastCharge: this.battCharge,
                    lastValue: this.battLast
                }
            });
        }
    },
}

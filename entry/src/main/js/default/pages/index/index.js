import app from '@system.app';
import router from '@system.router';
import file from '@system.file';
import logger from '../../common/logger.js';
import config from '../../common/config.js';

export default {
    data: {
        title: 'info',
        filename: '/nand/batt_stat',
        fileDaily: '/nand/batt_{0}_{1}',
        fileMonth: '/nand/batt_{0}',
        fileCharge: '/nand/batt_charge',
        battByHour:[],
        battByDay:[],
        battCharge: undefined,
        battLast: undefined,
        loading: true,
        showMenu: false,
        loadingText: "Loading..",
        recordCount: 0,
        fileSize: 0,
        firstTime: 0,
        lastTime: 0,
        hourPrev: 0,
        pageIndex: 0,
        titlePercent: "",
        titleLastCharge: "",
        titleUptime: "",
    },

    onInit() {
    },

    getCurrentTime() {
        var now = new Date();

        return {
            year: now.getFullYear(),
            month: now.getMonth()+1,
            day: now.getDate(),
            hour: now.getHours(),
            min: now.getMinutes()
        };
    },

    onShow() {
        this.loadStats();
    },

    loadStats() {

        //this.loading = true;

        this.hourPrev = -1;

        this.battByHour = [];
        this.battByDay = [];

//        this.battCharge = {
//            month: 12,
//            day: 1,
//            hour: 5,
//            min: 20,
//            level: 100,
//            charge: 0
//        };
//        this.setLastCharged();
//        this.titlePercent = this.battCharge.level +" => 82";

        this.loadLastCharge();
        this.loadBattByDay();
        this.loadBattByMonth();
    },

    loadLastCharge() {

        file.readArrayBuffer({
            uri: this.fileCharge,
            position: 0,
            length: 6,
            success: (data) => {
                this.battCharge = {
                    month: data.buffer[0],
                    day: data.buffer[1],
                    hour: data.buffer[2],
                    min: data.buffer[3],
                    level: data.buffer[4],
                    charge: data.buffer[5]
                };

                this.setLastCharged();
            },
            fail: () => {
                this.battCharge = undefined;
                this.titlePercent = "please charge";
                this.titleLastCharge = "to start collect";
                this.titleUptime = "statistics"
            }
        });

    },

    setLastCharged() {
        this.titleLastCharge = "charged: "
            + config.zeroPad(this.battCharge.day, 10)
            +"."+ config.zeroPad(this.battCharge.month, 10)
            +" " + config.zeroPad(this.battCharge.hour, 10)
            +":"+ config.zeroPad(this.battCharge.min, 10);

        this.setUptime();
    },

    setUptime() {

        if (this.battCharge == undefined) {
            this.titleUptime = "uptime: --";
            return;
        }

        let now = new Date();

        let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        let charge = new Date(now.getFullYear(), this.battCharge.month-1, this.battCharge.day,
            this.battCharge.hour, this.battCharge.min);

        let diffMs =  end - charge;

        var diffDays = Math.floor(diffMs / 86400000); // days
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

        if (diffDays == 0)
        {
            if (diffHrs == 0) {
                this.titleUptime = "uptime: "+ diffMins +" min";
            }
            else {
                this.titleUptime = "uptime: "+ config.zeroPad(diffHrs, 10)
                    +":"+ config.zeroPad(diffMins, 10) +" min";
            }
        }
        else {
            this.titleUptime = "uptime: "+
                diffDays + " days "+
                config.zeroPad(diffHrs, 10) +":"+
                config.zeroPad(diffMins, 10) +" min";
        }
    },

    loadBattByDay() {

        let now = this.getCurrentTime();
        let filename = this.fileDaily
            .replace("{0}", config.zeroPad(now.month, 10))
            .replace("{1}", config.zeroPad(now.day, 10));

        file.get({
            uri: filename,
            success: (info) => {

                this.fileSize = info.length;
                this.recordCount = info.length / 6;

                let len = info.length;
                let pos = 0;
                let blockLen = 1000;

                this.readBattData(filename, pos, blockLen, len, 1);
            },
            fail: (e) => {
                this.displayFail("daily: "+ e);
            }
        });
    },

    loadBattByMonth() {

        let now = this.getCurrentTime();
        let filename = this.fileMonth.replace("{0}", config.zeroPad(now.month, 10));

        file.get({
            uri: filename,
            success: (info) => {

                let len = info.length;
                let pos = 0;
                let blockLen = 1000;

                this.readBattData(filename, pos, blockLen, len, 2);
            },
            fail: (e) => {
                this.displayFail("month: "+ e);
            }
        });
    },

    readBattData(filename, pos, blockLen, totalLen, mode) {

        let left = totalLen - pos;
        let len = left > blockLen ? blockLen : left;

        file.readArrayBuffer({
            uri: filename,
            position: pos,
            length: len,
            success: (data) => {

                let displayFirst;
                let record;

                for (let i = 0; i < len; i += 6) {

                    record = {
                        month: data.buffer[i],
                        day: data.buffer[i + 1],
                        hour: data.buffer[i + 2],
                        min: data.buffer[i + 3],
                        level: data.buffer[i + 4],
                        charge: data.buffer[i + 5]
                    }

                    if (mode == 1) // daily
                        this.parseBattDaily(record);
                    if (mode == 2) // month
                        this.parseBattMonth(record);

                    if (mode == 1) {
                        if (i == 0 && pos == 0) {
                            displayFirst = "[" + config.zeroPad(record.hour, 10)
                            + ":" + config.zeroPad(record.min, 10)
                            + "] " + record.level;

                            this.firstTime = displayFirst;
                        }
                    }
                }

                pos += len;
                if (pos == totalLen) {
                    this.loading = false;

                    if (mode == 1) {
                        let display = "[" + config.zeroPad(record.hour, 10)
                        + ":" + config.zeroPad(record.min, 10)
                        + "] " + record.level;

                        this.lastTime = display;
                        this.titlePercent = this.battCharge.level +" => "+ record.level;
                    }
                }
                else {
                    this.readBattData(filename, pos, blockLen, totalLen, mode);
                }
            },
            fail: (data, code) => {
                let error = "code: " + code + ", " + data;
                this.displayFail(error);
            }
        });
    },

    displayFail(e) {

        this.loadingText = e;
    },

    onTitleClick() {
        this.loadStats();
    },

    onItemClick() {
    },

    parseBattDaily(e) {

        if (this.battByHour.length == 0) {
            this.battByHour.push(e);
        }

        this.battLast = e;

        if (this.hourPrev != e.hour && e.min == 0) {
            if (this.battByHour.length > 20) this.battByHour.shift();
            this.battByHour.push(e);
            this.hourPrev = e.hour;
        }
    },

    parseBattMonth(e) {

        if (this.battByDay.length == 0) {
            if (this.battByDay.length > 20) this.battByDay.shift();
            this.battByDay.push(e);
        }
        else if (e.hour == 0 && e.min == 0) {
            if (this.battByDay.length > 20) this.battByDay.shift();
            this.battByDay.push(e);
        }
    },

    touchMove(e) {
        if (e.direction == "right") {
            if (this.pageIndex == 0)
                app.terminate();
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

    onMenuClear() {

        this.showMenu = false;

        file.delete({uri: this.filename });
        file.delete({uri: this.fileCharge });

        let now = this.getCurrentTime();

        for (var i = 1; i <= now.day ; i++) {
            let filename = this.fileDaily
            .replace("{0}", config.zeroPad(now.month, 10))
                .replace("{1}", config.zeroPad(i, 10));

            file.delete({uri: filename });
        }

        this.loadStats();

        //filename = this.fileMonth.replace("{0}", config.zeroPad(now.month, 10));
        //file.delete({uri: filename });
    },

    onMenuCancel() {
        this.showMenu = false;
    },

    onLongPress() {
        this.showMenu = true;
    }
}

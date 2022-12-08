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
        battByHourPrev:[],
        battByDay:[],
        battCharge: undefined,
        battLast: undefined,
        loading: true,
        showMenu: false,
        nodata: "Please charge\r\nto start collect\r\n\statistics",
        recordCount: 0,
        fileSize: 0,
        firstTime: 0,
        lastTime: 0,
        hourPrev: 0,
        dayPrev: 0,
        pageIndex: 0,
        titlePercent: "",
        titleLastCharge: "",
        titleUptime: "",
        titleEstimated: "",
        percentFrom: 100,
        percentTo: 0,
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

    getYesterdayTime() {
        var now = new Date();
        now.setDate(now.getDate()-1);

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

//        this.battCharge = {
//            month: 12,
//            day: 5,
//            hour: 0,
//            min: 20,
//            level: 100,
//            charge: 0
//        };
//        this.battLast = {
//            month: 12,
//            day: 8,
//            hour: 6,
//            min: 10,
//            level: 82,
//            charge: 0
//        };
//        this.setLastCharged();
//        this.percentTo = 85;

        this.loadLastCharge();
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

                this.loadBattByDay();
                this.loadBattByMonth();
            },
            fail: () => {
                this.loading = true;
            }
        });

    },

    setLastCharged() {

        this.percentFrom = this.battCharge.level;

        this.titleLastCharge = ""
            + config.zeroPad(this.battCharge.day, 10)
            +"/"+ config.zeroPad(this.battCharge.month, 10)
            +" " + config.zeroPad(this.battCharge.hour, 10)
            +":"+ config.zeroPad(this.battCharge.min, 10);

        this.setUptime();
    },

    setUptime() {

        if (this.battCharge == undefined) {
            this.titleUptime = "--";
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
                this.titleUptime = ""+ diffMins +" min";
            }
            else {
                this.titleUptime = ""+ config.zeroPad(diffHrs, 10)
                    +":"+ config.zeroPad(diffMins, 10) +" min";
            }
        }
        else {
            this.titleUptime = ""+
                diffDays + " "+ this.getPluralDay(diffDays)+" "+
                config.zeroPad(diffHrs, 10) +":"+
                config.zeroPad(diffMins, 10) +" min";
        }
    },

    setEstimatedTime() {

        if (this.battCharge == undefined || this.battLast == undefined) {
            this.titleEstimated = "--";
            return;
        }

        let now = new Date();

        let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        let charge = new Date(now.getFullYear(), this.battCharge.month-1, this.battCharge.day,
            this.battCharge.hour, this.battCharge.min);

        let deltaLevel = this.battCharge.level - this.battLast.level;
        let diffMsPass = end - charge;
        let diffMs = parseInt((diffMsPass * this.battLast.level) / deltaLevel);

        var diffDays = Math.floor(diffMs / 86400000); // days
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

        if (diffDays == 0)
        {
            if (diffHrs == 0) {
                this.titleEstimated = ""+ diffMins +" min";
            }
            else {
                this.titleEstimated = ""+ config.zeroPad(diffHrs, 10)
                +":"+ config.zeroPad(diffMins, 10) +" min";
            }
        }
        else {
            this.titleEstimated = ""+
            diffDays + " "+ this.getPluralDay(diffDays)+" "+
            config.zeroPad(diffHrs, 10) +":"+
            config.zeroPad(diffMins, 10) +" min";
        }
    },

    getPluralDay(count) {
        if (count == 1) return "day";
        return "days";
    },

    loadBattByDay() {

        this.hourPrev = 0;
        this.battByHour = [];

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

                this.readBattData(filename, pos, blockLen, len, 1, 0);
            },
            fail: (e) => {
                this.displayFail("daily: "+ e);
            }
        });
    },

    loadBattByDayPrev() {

        this.hourPrev - 0;
        this.battByHourPrev = [];

        let now = this.getYesterdayTime();

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

                this.readBattData(filename, pos, blockLen, len, 1, -1);
            },
            fail: (e) => {
                this.displayFail("daily: "+ e);
            }
        });
    },

    loadBattByMonth() {

        this.dayPrev = 0;
        this.battByDay = [];

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

    readBattData(filename, pos, blockLen, totalLen, mode, addDays) {

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
                        this.parseBattDaily(record, addDays);
                    else if (mode == 2) // month
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

                    if (mode == 1 && addDays == 0) {
                        let display = "[" + config.zeroPad(record.hour, 10)
                        + ":" + config.zeroPad(record.min, 10)
                        + "] " + record.level;

                        this.lastTime = display;
                        //this.titlePercent = this.battCharge.level +" => "+ record.level;
                        this.percentTo = record.level;

                        this.setEstimatedTime();

                        if (this.battByHour.length < 20) {
                            this.loadBattByDayPrev();
                        }
                    }
                }
                else {
                    this.readBattData(filename, pos, blockLen, totalLen, mode, addDays);
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

    parseBattDaily(e, addDays) {

        if (addDays == 0) {
            this.battLast = e;

            if (this.battByHour.length == 0) {
                this.battByHour.push(e);
                this.hourPrev = e;
            }
            else if (this.hourPrev.hour != e.hour) {
                if (e.min == 0) {
                    if (this.battByHour.length > 20) this.battByHour.shift();
                    this.battByHour.push(e);
                    this.hourPrev = e;
                }
            }
            else if (this.hourPrev.level < e.level) {
                // if battery was on charge, set maximum value
                this.battByHour.pop();
                e.min = 0;
                this.battByHour.push(e);
            }
        }
        else {

            // skip data before charge
            if (this.battCharge.day > e.day ||
                this.battCharge.month > e.month ||
                this.battCharge.hour > e.hour)
            {
                return;
            }

            if (this.battByHourPrev.length == 0) {
                this.battByHourPrev.push(e);
                this.hourPrev = e;
            }
            else if (this.battByHourPrev.hour != e.hour) {
                if (e.min == 0) {
                    if (this.battByHourPrev.length > 20) this.battByHourPrev.shift();
                    this.battByHourPrev.push(e);
                    this.hourPrev = e;
                }
            }
            else if (this.hourPrev.level < e.level) {
                // if battery was on charge, set maximum value
                this.battByHourPrev.pop();
                e.min = 0;
                this.battByHourPrev.push(e);
            }
        }
    },

    parseBattMonth(e) {

        if (this.battByDay.length == 0) {
            this.battByDay.push(e);
            this.dayPrev = e;
        }
        else if (e.hour == 0 && e.min == 0) {
            if (this.battByDay.length > 20) this.battByDay.shift();
            this.battByDay.push(e);
            this.dayPrev = e;
        }
        else if (this.dayPrev.level < e.level) {
            // if battery was on charge, set maximum value
            this.battByDay.pop();
            e.hour = 0;
            e.min = 0;
            this.battByDay.push(e);
        }
    },

    touchMove(e) {
        if (e.direction == "right") {
            if (this.pageIndex == 0)
                app.terminate();
        }
        else if (e.direction == "up") {

            if (this.battByHour.length < 20) {
                let sliceLen = 20 - this.battByHour.length;
                let sliced = this.battByHourPrev.slice(-sliceLen);
                this.battByHour = sliced.concat(this.battByHour);
            }

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

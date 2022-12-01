import app from '@system.app';
import router from '@system.router';
import file from '@system.file';
import logger from '../../common/logger.js';
import config from '../../common/config.js';

export default {
    data: {
        title: 'Hour view',
        loading: false,
        loadingText: "Loading..",
        levelStart: 0,
        levelEnd: 0,
        levelMax: 0,
        levelMin: 0,
        chargeTimePrefix: "charged: ",
        chargeFromPrefix: "on battery ",
        chargeTime: "",
        chargeFrom: "",
        battByHour:[],
        battByDay:[],
        battCharge: null,
        battLast: null,
        options: {
            xAxis: {
                min: 0,
                max: 124,
                axisTick: 20,
                display: true,
                color: "#8781b4",
            },
            yAxis: {
                min: 0,
                max: 100,
                axisTick: 10,
                display: false,
                color: "#8781b4",
            },
        },
        barData: [{
                data: [],
                gradient: true,
                strokeColor: "#00000000",
                fillColor: "#1781b4",
            },
            {
                data: [],
                gradient: true,
                strokeColor: "#00000000",
                fillColor: "#A02020",
            },
        ]
    },

    onInit() {

        this.battByHour = this.dataByHour;
        this.battByDay = this.dataByDay;
        this.battCharge = this.lastCharge;
        this.battLast = this.lastValue;

        let batt = this.battByHour;

        let dataLevel = batt.map(e => e.level);
        let dataUse = [];
        dataUse[0] = 0;
        for (var i = 1; i < dataLevel.length; i++) {
            let delta = dataLevel[i-1] - dataLevel[i];
            delta = delta * 4;
            dataUse[i] = delta;
        }

        this.barData[0].data = dataLevel;
        this.barData[1].data = dataUse;

        this.levelStart = batt[0].level;

        this.levelEnd = this.battLast.level;

        this.chargeTime = "--";
        this.chargeFrom = "--";

        if (batt.length > 0) this.levelMin = 100;
        for (let i = 0; i < batt.length ; i++) {
            let e = batt[i];
            let level = batt[i].level;
            if (level > this.levelMax) this.levelMax = level;
            if (level < this.levelMin) this.levelMin = level;
        }

        if (this.battCharge != null) {

            this.chargeTime = "" + config.zeroPad(this.battCharge.hour, 10)
                + ":" + config.zeroPad(this.battCharge.min, 10)
                + " to "+ this.battCharge.level +"%";

            if (this.battLast.charge == 0) {

                if (this.chargeTime != "--") {

                    let minCurr = (this.battLast.hour * 60) + this.battLast.min;
                    let minChrg = (this.battCharge.hour * 60) + this.battCharge.min;

                    let diff = minCurr - minChrg;
                    let diffMin = diff % 60;
                    let diffHour = (diff - diffMin) / 60;

                    this.chargeFrom = "" + config.zeroPad(diffHour, 10)
                        + ":" + config.zeroPad(diffMin, 10)
                        + " min";
                }
            }
            else {
                this.chargeFrom = "charging..";
            }
        }

        this.loading = false;
    },

    onTitleClick() {
    },

    touchMove(e) {
        if (e.direction == "right") {
            app.terminate();
        }
        else if (e.direction == "up") {
            router.replace({
                uri: "pages/day/index",
                params: {
                    dataByHour: this.battByHour,
                    dataByDay: this.battByDay,
                    lastCharge: this.battCharge,
                    lastValue: this.battLast
                }
            });
        }
        else if (e.direction == "down") {
            router.replace({
                uri: "pages/index/index"
            });
        }
    },
}


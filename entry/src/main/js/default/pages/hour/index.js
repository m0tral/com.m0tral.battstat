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
        titleDrain: "",
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
        barLevel: [{
                data: [],
                gradient: true,
                strokeColor: "#00000000",
                fillColor: "#1781b4",
            }],
        barDiff: [{
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
        let maxDrain = 0;
        let avgDrain = 0;

        let dataLevel = batt.map(e => e.level);
        let dataUse = [];
        dataUse[0] = 0;
        for (var i = 1; i < dataLevel.length; i++) {
            let delta = dataLevel[i-1] - dataLevel[i];
            if (delta > maxDrain) maxDrain = delta;

            delta = delta * 4;
            dataUse[i] = delta;
        }
        dataUse.unshift();
        dataUse.push(0);

        if (dataUse.length > 0) {
            avgDrain = dataUse.reduce((a, b) => {
                if (b > 0) { return a + b; } else { return a + 0; }
            }, 0) / dataUse.length;
        }

        this.barLevel[0].data = dataLevel;
        this.barDiff[0].data = dataUse;

        this.levelStart = batt[0].level;

        this.levelEnd = this.battLast.level;

        if (batt.length > 0) this.levelMin = 100;
        for (let i = 0; i < batt.length ; i++) {
            let e = batt[i];
            let level = batt[i].level;
            if (level > this.levelMax) this.levelMax = level;
            if (level < this.levelMin) this.levelMin = level;
        }

        this.titleDrain = "drain max: "+ maxDrain +"% avg: "+ avgDrain +"%";

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


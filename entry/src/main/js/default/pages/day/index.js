import app from '@system.app';
import router from '@system.router';
import file from '@system.file';
import logger from '../../common/logger.js';
import config from '../../common/config.js';

export default {
    data: {
        title: 'Day view',
        filename: '/nand/batt_stat',
        loading: true,
        loadingText: "Loading..",
        levelStart: 0,
        levelEnd: 0,
        levelMax: 0,
        levelMin: 0,
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
                strokeColor: "#161571",
                fillColor: "#1781b4",
            },
        ]
    },

    onInit() {

        this.battByHour = this.dataByHour;
        this.battByDay = this.dataByDay;
        this.battCharge = this.lastCharge;
        this.battLast = this.lastValue;

        let batt = this.battByDay;

        this.levelStart = batt[0].level;
        this.levelEnd = batt[batt.length-1].level;

        if (batt.length > 0) this.levelMin = 100;
        for (let i = 0; i < batt.length ; i++) {
            let level = batt[i].level;
            if (level > this.levelMax) this.levelMax = level;
            if (level < this.levelMin) this.levelMin = level;
        }

        this.barData[0].data  = batt.map(e => e.level);

        this.loading = false;
    },

    onTitleClick() {
    },

    touchMove(e) {
        if (e.direction == "right") {
            app.terminate();
        }
        else if (e.direction == "down") {
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


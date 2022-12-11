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
        showMin: false,
        scaleXStart: "",
        scaleXEnd: "",
        levelMax: 0,
        levelMin: 0,
        levelMaxX: 15,
        levelMaxY: 100,
        levelMinX: 15,
        levelMinY: 120,
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
        barData: [{
                data: [],
                gradient: true,
                strokeColor: "#161571",
                fillColor: "#1781b4",
            },
        ]
    },

    onInit() {

        this.showMin = false;

        this.battByHour = this.dataByHour;
        this.battByDay = this.dataByDay;
        this.battCharge = this.lastCharge;
        this.battLast = this.lastValue;

        let batt = this.battByDay;
        let maxDrain = 0;
        let avgDrain = 0;

        let dataLevel = batt.map(e => e.level);

        let rec = batt[0];
        this.scaleXStart = config.zeroPad(rec.day, 10) +"/"+ config.zeroPad(rec.month, 10);
        rec = batt[batt.length-1];
        this.scaleXEnd = config.zeroPad(rec.day, 10) +"/"+ config.zeroPad(rec.month, 10);

        if (batt.length > 0) this.levelMin = 100;
        for (let i = 0; i < batt.length ; i++) {
            let level = batt[i].level;
            if (level > this.levelMax) this.levelMax = level;
            if (level < this.levelMin) this.levelMin = level;
        }

        let dataUse = [];
        dataUse[0] = 0;
        for (var i = 1; i < dataLevel.length; i++) {
            let delta = dataLevel[i-1] - dataLevel[i];
            if (delta > maxDrain) maxDrain = delta;

            dataUse[i] = delta;
        }
        dataUse.unshift();
        dataUse.push(0);

        if (dataUse.length > 0) {
            avgDrain = dataUse.reduce((a, b) => {
                if (b > 0) { return a + b; } else { return a + 0; }
            }, 0) / dataUse.length;
        }

        let hasFact = (avgDrain - parseInt(avgDrain)) > 0;
        this.titleDrain = this.$t('strings.drain_max') +" "+ maxDrain
        + "% "+ this.$t('strings.avg') +" "+ (hasFact ? avgDrain.toFixed(1) : parseInt(avgDrain)) +"%";

        this.barData[0].data  = dataLevel;

        this.calcLevelMinMax(batt, this.battLast);

        this.loading = false;
    },

    calcLevelMinMax(batt, battLast) {
        this.levelMaxX = 40;
        this.levelMaxY = 84 + (150 - parseInt(batt[0].level * 1.5));

        if (batt.length > 1) {
            this.showMin = true;

            if (batt.length < 3) {
                this.levelMaxX = 30;
                this.levelMinX = 85;
            }
            else {
                this.levelMinX = 35 + (batt.length * 18);
            }
            this.levelMinY = 84 + (150 - parseInt(battLast.level * 1.5));
        }

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


import app from '@system.app';
import router from '@system.router';
import file from '@system.file';
import logger from '../../common/logger.js';
import config from '../../common/config.js';

export default {
    data: {
        title: 'Hour view',
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
                min: 0, max: 124, axisTick: 20, display: true, color: "#8781b4",
            },
            yAxis: {
                min: 0, max: 100, axisTick: 10, display: false, color: "#8781b4",
            },
        },
        // 09:00-18:00
        barLevelDay: [{
                data: [], gradient: true,
                strokeColor: "#00000000", fillColor: "#1780b0",
            }],
        // 06:00-09:00, 18:00-00:00
        barLevelMiddle: [{
                          data: [], gradient: true,
                          strokeColor: "#00000000", fillColor: "#176090",
                      }],
        // 00:00-06:00
        barLevelNight: [{
                          data: [], gradient: true,
                          strokeColor: "#00000000", fillColor: "#174070",
                      }],
        barDiff: [{
                data: [], gradient: true,
                strokeColor: "#00000000", fillColor: "#A02020",
            },
        ]
    },

    onInit() {

        this.showMin = false;

        this.battByHour = this.dataByHour;
        this.battByDay = this.dataByDay;
        this.battCharge = this.lastCharge;
        this.battLast = this.lastValue;

        let batt = this.battByHour;
        let maxDrain = 0;
        let avgDrain = 0;

        if (batt == null || batt.length == 0)
            return;

        let dataLevel = batt.map(e => e.level);

        let dataLevelDay = batt.map(e => {
            if (e.hour >= 9 && e.hour < 18)
                return e.level;
            else
                return 0;
        });
        let dataLevelMiddle = batt.map(e => {
            if ((e.hour >= 6 && e.hour < 9) || (e.hour >= 18 && e.hour < 24))
                return e.level;
            else
                return 0;
        });
        let dataLevelNight = batt.map(e => {
            if (e.hour >= 0 && e.hour < 6)
                return e.level;
            else
                return 0;
        });

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

        this.barLevelDay[0].data = dataLevelDay;
        this.barLevelMiddle[0].data = dataLevelMiddle;
        this.barLevelNight[0].data = dataLevelNight;
        this.barDiff[0].data = dataUse.map(d => d * 3);

        this.scaleXStart = config.zeroPad(batt[0].hour, 10) +":00";
        this.scaleXEnd = config.zeroPad(this.battLast.hour, 10) +":00";

        if (batt.length > 0) this.levelMin = 100;
        for (let i = 0; i < batt.length ; i++) {
            let level = batt[i].level;
            if (level > this.levelMax) this.levelMax = level;
            if (level < this.levelMin) this.levelMin = level;
        }

        if (this.battLast.level < this.levelMin) this.levelMin = this.battLast.level;

        let hasFact = (avgDrain - parseInt(avgDrain)) > 0;
        this.titleDrain = this.$t('strings.drain_max') +" "+ maxDrain
            + "% "+ this.$t('strings.avg') +" "+ (hasFact ? avgDrain.toFixed(1) : parseInt(avgDrain)) +"%";

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


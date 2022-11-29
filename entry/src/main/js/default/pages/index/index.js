import app from '@system.app';
import file from '@system.file';
import logger from '../../common/logger.js';

export default {
    data: {
        title: '/nand/batt_stat',
        filename: '/nand/batt_stat',
        dataList: [],
        fileCreated: false,
        progress: 0,
    },

    onInit() {

        this.bindRoot();
    },

    bindRoot() {

        this.dataList = [];

        file.get({
            uri: this.filename,
            success: (info) => {

                file.readArrayBuffer({
                    uri: this.title,
                    position: 0,
                    length: info.length,
                    success: (data) => {

                        for (let i = 0; i<info.length; i+=5) {

                            let display = "["+ data.buffer[i].toString()
                                + ":" + data.buffer[i+1].toString()
                                + ":" + data.buffer[i+2].toString()
                                + "] "+ data.buffer[i+3].toString();

                            this.dataList.push({
                                uri: "/",
                                src: display,
                                type: 'dir',
                            });
                        }
                    },
                    fail: (e) => {
                        this.dataList.push({
                            uri: "/",
                            src: "read filed",
                            type: 'dir',
                        });
                    }
                });
            }
        });
    },

    bindFileList(dir) {

        if (dir == "" || dir == null)
        {
            this.bindRoot();
            return;
        }

        this.dataList = [];

        let currentDir = dir;
        this.title = currentDir;

    },

    onTitleClick() {
        this.bindRoot();
    },

    onItemClick(e) {
    },

    touchMove(e) {
        if (e.direction == "right") {
            app.terminate();
        }
    },
}

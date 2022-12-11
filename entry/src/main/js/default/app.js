import logger from '../default/common/logger.js'

export default {

    onCreate() {
        console.info("app created");
        //FeatureAbility.sendMsg({ deviceId: "M2106W1", bundleName: "com.m0tral.music", message: "music player started" });
    },
    onDestroy() {
        console.info("app destroyed");
    }
};

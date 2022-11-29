import logger from '../default/common/logger.js'

export default {

    onCreate() {
        console.info("app created");
        logger.sayHelo();
    },
    onDestroy() {
        console.info("app destroyed");
        logger.sayBye();
    }
};

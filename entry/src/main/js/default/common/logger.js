import interconnect from '@system.interconnect';

export default {

    sendMessage(msg) {
        var conn = interconnect.instance();
        conn.send({ data: { data: msg } });
    },

    sayHelo() {
        this.sendMessage("batt_stats started");
    },

    sayBye() {
        this.sendMessage("batt_stats closed");
    }
}
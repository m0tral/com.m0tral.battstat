import interconnect from '@system.interconnect';

export default {

    sendMessage(msg) {
        var conn = interconnect.instance();
        conn.send({ data: { data: msg } });
    },

    sayHelo() {
        this.sendMessage("MiWatch Tweak started");
    },

    sayBye() {
        this.sendMessage("MiWatch Tweak closed");
    }
}
const dns = require("node:dns").promises;

(async () => {
    try {
        const records = await dns.resolveSrv(
            "_mongodb._tcp.cluster0.azdr0e1.mongodb.net"
        );
        console.log(records);
    } catch (err) {
        console.error(err);
    }
})();
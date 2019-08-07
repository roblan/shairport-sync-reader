const dgram = require('dgram');
const ShairportSyncReader = require('./shairport-sync-reader-base');

class ShairportSyncReaderUDP extends ShairportSyncReader {
	constructor(opts) {
		super();
		this._source = dgram.createSocket('udp4');

		this._source.bind(opts.port, () => this._source.addMembership(opts.address));

		this._total = 0;
		this._chunked = Buffer.allocUnsafe(0);

		this._source.on('message', msg => {
			const data = {
				type: msg.toString('utf8', 0, 4),
				code: msg.toString('utf8', 4, 8),
			};

			if (data.code === 'chnk') {
				this._total += 1;
				const total = parseInt(msg.toString('hex', 12, 16), 16);
				this._chunked = Buffer.concat([this._chunked, msg.slice(24)]);

				if (this._total === total) {
					this.useData({
						type: msg.toString('utf8', 16, 20),
						code: msg.toString('utf8', 20, 24),
						cont: this._chunked,
					});
					this._total = 0;
				}
			} else {
				if (!this._total) {
					this._total = 0;
					this._chunked = Buffer.allocUnsafe(0);
				}

				data.cont = msg.slice(8);

				this.useData(data);
			}
		});
	}
}

module.exports = ShairportSyncReaderUDP;

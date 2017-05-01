const dgram = require('dgram');
const ShairportSyncReader = require('./shairport-sync-reader-base');

class ShairportSyncReaderUDP extends ShairportSyncReader {
	constructor(opts) {
		super();
		this._source = dgram.createSocket('udp4');

		this._source.bind(opts.port, () => this._source.addMembership(opts.address));

		this._source.on('message', msg =>
			this.useData({
				type: msg.toString(undefined, 0, 4),
				code: msg.toString(undefined, 4, 8),
				cont: msg.slice(8)
			})
		);
	}
}

module.exports = ShairportSyncReaderUDP;
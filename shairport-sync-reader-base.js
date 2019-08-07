const EventEmitter = require('events');
const parser = require('daap-parser');

const remoteProps = {
	daid: 'DACP-ID',
	acre: 'Active-Remote',
	snam: 'X-Apple-Client-Name',
	snua: 'User-Agent',
	clip: 'Client-IP',
	dapo: 'Port',
};
const prgr = ['start', 'current', 'end'];

var objectify = (str, split, map, order) =>
	str.split(split).map(map).reduce((memo, val, i) => {
		memo[order[i]] = val;
		return memo;
	}, {});

class ShairportSyncReader extends EventEmitter {
	constructor() {
		super();
		this._meta = {},
		this._remote = {},
		this._rtptime = {
			meta: 0,
			pict: 0
		};
	}
	destroy() {}
	_preparseData(code, cont) {
		switch (code) {
			case 'prgr':
				cont = objectify(cont, '/', x => parseInt(x, 10), ['start', 'current', 'end']);
				break;
			case 'pvol':
				cont = objectify(cont, ',', parseFloat, ['airplay', 'volume', 'lowest', 'highest']);
				break;
			case 'pbeg':
			case 'dapo':
				cont = this._remote;
				break;
			case 'pend':
				cont = this._remote;
				this._remote = {};
				break;
		}
		return cont;
	}
	useData(data) {
		if (data.type == 'ssnc') {
			if (data.code !== 'PICT') {
				data.cont = data.cont.toString();
			}

			if (remoteProps[data.code]) {
				this._remote[remoteProps[data.code]] = data.cont;
				if (data.code !== 'dapo') {
					return;
				}
			}

			// preparse data
			data.cont = this._preparseData(data.code, data.cont);

			// use data
			switch (data.code) {
				case 'mdst':
					this._meta = {};
					this._rtptime.meta = data.cont;					
					break;
				case 'mden':
					this.emit('meta', this._meta);
					break;
				case 'pcst':
					this._pictStart = true;
					break;
				case 'pcen':
					this._pictStart = false;
					break;
				case 'stal':
					this.emit('error', data.code);
					break;
				case 'dapo':
					this.emit('client', data.cont);
					break;
				case 'PICT':
					if (this._pictStart && data.cont.length) {
						this.emit(data.code, data.cont);
					}
					break;
				default:
					this.emit(data.code, data.cont);
			}
		} else {
			this._meta[data.code] = parser.parseTag(data.code, data.cont);
		}
	}
}

module.exports = ShairportSyncReader;

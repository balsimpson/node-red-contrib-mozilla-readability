const https = require('https');
const url = require('url');
const unfluff = require('unfluff');

const makeHttpCall = async (options) => {
	return new Promise((resolve) => {
		var req = https.request(options, res => {
			res.setEncoding('utf8');
			var returnData = "";
			res.on('data', chunk => {
				returnData = returnData + chunk;
			});
			res.on('end', () => {
				// let results = JSON.parse(returnData);
				// resolve(results);
				resolve(returnData);
			});
		});
		if (options.method == 'POST' || options.method == 'PATCH') {
			req.write(JSON.stringify(options.body));
		}
		req.end();
	})
}

async function getText(urlString) {
	try {
		let parsed_url = url.parse(urlString);
		let options = {
			host: parsed_url.host,
			path: parsed_url.path,
			method: 'GET'
		}

		let html = await makeHttpCall(options);
		let res = unfluff(html);

		return res;
	} catch (error) {
		return 'error: ' + error;
	}
}

module.exports = function (RED) {
	function UnfluffNode(config) {
		RED.nodes.createNode(this, config);
		let node = this;

		let data = {
			url: config.url
		}

		node.on('input', function (msg) {

			data.url = config.url ? config.url : msg.url;
			let results = getText(data.url);
			node.status({ fill: 'yellow', shape: 'ring', text: 'Requesting'  });
			results.then((value) => {
				if (value.error) {
					node.status({ fill: 'red', shape: 'ring', text: 'error - ' + data.url });
					node.error(value.error);
				} else {
					try {
						msg.payload = value;
						node.status({ fill: 'green', shape: 'dot', text: `Parsed `  });
						node.send(msg);
					} catch (error) {
						node.status({ fill: 'red', shape: 'dot', text: 'Error' });
						node.error(error);
					}
				}
			});
		});
	}
	RED.nodes.registerType('unfluff', UnfluffNode);
}
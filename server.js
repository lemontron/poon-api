import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import express from 'express';

const WebSocket = Npm.require(`${__meteor_bootstrap__.serverDir}/npm/node_modules/meteor/ddp-server/node_modules/faye-websocket`);

export const websocket = (path, handler, {sameOrigin = false, authorize, ...options} = {}) => {
	if (typeof path !== 'string') {
		throw new TypeError('websocket() path must be a string');
	}
	WebApp.httpServer.on('upgrade', async (req, socket, head) => {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname !== path) {
			return;
		}
		try {
			if (!WebSocket.isWebSocket(req)) {
				return socket.destroy();
			}
			if (sameOrigin) {
				const origins = [`http://${req.headers.host}`, `https://${req.headers.host}`];
				if (!origins.includes(req.headers.origin)) {
					return socket.destroy();
				}
			}
			const token = url.searchParams.get('token');
			let user;
			if (token) {
				user = await Meteor.users.findOneAsync({
					'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
				});
			}
			if (socket.destroyed) {
				return;
			}
			if (authorize) {
				try {
					const ok = await authorize(url.searchParams, user, req);
					if (!ok) {
						return socket.destroy();
					}
				} catch (err) {
					console.warn(err);
					return socket.destroy();
				}
			}
			if (socket.destroyed) {
				return;
			}

			const peer = new WebSocket(req, socket, head, null, options);
			peer.onerror = () => {
				return peer.close();
			};
			await new Promise(resolve => {
				peer.onopen = resolve;
				peer.onclose = resolve;
			});
			if (peer.readyState !== 1) {
				return;
			}
			await handler(peer, url.searchParams, user, req);
		} catch (error) {
			if (error instanceof Meteor.Error && error.error === 'peer') {
				console.warn(`[WebSocket ${path}] ${error.reason}`, {
					'id': url.searchParams.get('id'),
					'storeId': url.searchParams.get('storeId'),
					'origin': req.headers.origin,
					'userAgent': req.headers['user-agent'],
					'forwardedFor': req.headers['x-forwarded-for'],
					'remoteAddress': req.socket.remoteAddress,
				});
			} else {
				console.error(`[WebSocket ${path}]`, error);
			}
			socket.destroy();
		}
	});
};

export const api = express();
const app = express();

api.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.json({
		'error': err.message,
	});
});

app.use('/api', api);

WebApp.rawConnectHandlers.use((req, res, next) => {
	if (req.url !== '/api' && !req.url.startsWith('/api/')) {
		return next();
	}
	return app(req, res, next);
});

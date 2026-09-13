import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import express from 'express';

const WebSocket = Npm.require(`${__meteor_bootstrap__.serverDir}/npm/node_modules/meteor/ddp-server/node_modules/faye-websocket`);

export const websocket = (path, handler, {sameOrigin = false, ...options} = {}) => {
	WebApp.httpServer.on('upgrade', async (req, socket, head) => {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname !== path) return;
		if (!WebSocket.isWebSocket(req)) return socket.destroy();
		if (sameOrigin) {
			const origins = [`http://${req.headers.host}`, `https://${req.headers.host}`];
			if (!origins.includes(req.headers.origin)) return socket.destroy();
		}

		try {
			const token = url.searchParams.get('token');
			const user = token ? await Meteor.users.findOneAsync({
				'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
			}) : undefined;
			if (socket.destroyed) return;

			const peer = new WebSocket(req, socket, head, null, options);
			peer.onerror = () => peer.close();
			await new Promise(resolve => {
				peer.onopen = resolve;
				peer.onclose = resolve;
			});
			if (peer.readyState !== 1) return;
			await handler(peer, url.searchParams, user, req);
		} catch (error) {
			console.error(`[WebSocket ${path}]`, error);
			socket.destroy();
		}
	});
};

export const api = express();
const app = express();

api.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.json({'error': err.message});
});

app.use('/api', api);

WebApp.rawConnectHandlers.use((req, res, next) => {
	if (req.url !== '/api' && !req.url.startsWith('/api/')) return next();
	return app(req, res, next);
});

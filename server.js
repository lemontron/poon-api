import { WebApp } from 'meteor/webapp';
import express from 'express';

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

import { WebApp } from 'meteor/webapp';
import express from 'express';

export const api = express();

api.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.json({'error': err.message});
});

WebApp.rawConnectHandlers.use('/api', api);

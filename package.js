Package.describe({
	name: 'poon-api',
	version: '1.0.0',
	summary: 'Express API route mount for Poon apps',
});

Npm.depends({
	express: '5.2.1',
});

Package.onUse(api => {
	api.use('ecmascript');
	api.use('meteor');
	api.use('modules');
	api.use('webapp');
	api.mainModule('server.js', 'server');
});

# Poon API

Express API route mounting for Poon Meteor apps.

## Usage

```bash
meteor add poon-api
```

```javascript
import { api } from 'meteor/poon-api';

api.get('/status', async (req, res) => {
	res.json({'ok': true});
});
```

WebSocket routes match exact string paths. Regular expressions throw at registration. Pass variable values in the query string:

```javascript
import { websocket } from 'meteor/poon-api';

websocket('/api/browsers', (peer, params) => {
	const browserId = params.get('browserId');
});
```

Query parameters are available as `URLSearchParams` in both `authorize` and the connection handler.

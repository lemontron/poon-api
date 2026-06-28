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

const { v4: uuidv4 } = require('uuid');

// Generate a secure key
const secureKey = uuidv4();
console.log('Generated MDB_API_KEY:', secureKey);
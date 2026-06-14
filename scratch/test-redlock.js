const Redlock = require('redlock').default || require('redlock');
console.log('Redlock type:', typeof Redlock);
console.log('Redlock constructor present:', typeof Redlock === 'function');

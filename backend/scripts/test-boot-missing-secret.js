const dotenv = require('dotenv');
dotenv.config = () => ({ parsed: {} });
delete process.env.JWT_SECRET_KEY;
delete process.env.JWT_SECRET;
require('ts-node').register({ transpileOnly: true });
require('../src/app.ts');

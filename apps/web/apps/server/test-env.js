const { spawn } = require('child_process');

const env = {
  ...process.env,
  SUPERADMIN_EMAIL: 'superadmin@kapitbisig.local'
};

const child = spawn('node', ['-e', 'console.log(process.env.SUPERADMIN_EMAIL)'], { env, stdio: 'inherit' });

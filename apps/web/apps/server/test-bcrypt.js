const bcrypt = require('bcrypt');

async function test() {
  const hash = '$2b$12$V5PHd.zJhzX0b5LaT7VimeKQMO9wvY9Re1dA9kzv.UzeL7jzWOdWO';
  const password = 'KapitBisig@LGU2026!Xyz';
  console.log('Match?', await bcrypt.compare(password, hash));
}
test();

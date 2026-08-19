import bcrypt from 'bcrypt';
import { normalizePhilippineMobileNumber, isValidPhilippineMobileNumber } from './apps/web/apps/server/utils/mobileNumber';

async function run() {
  const hash = '$2b$12$V5PHd.zJhzX0b5LaT7VimeKQMO9wvY9Re1dA9kzv.UzeL7jzWOdWO';
  const password = 'KapitBisig@LGU2026!Xyz';
  console.log('bcrypt compare unified:', await bcrypt.compare(password, hash));

  const mobile = '09099728765';
  console.log('normalize mobile:', normalizePhilippineMobileNumber(mobile));
  console.log('is valid mobile:', isValidPhilippineMobileNumber(normalizePhilippineMobileNumber(mobile)));

}

run().catch(console.error);

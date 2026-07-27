const bcrypt = require('bcryptjs');

const passwords = ['pass123', 'director123', 'manager123', '123456'];

passwords.forEach(pw => {
  const hash = bcrypt.hashSync(pw, 10);
  console.log(`${pw} => ${hash}`);
});

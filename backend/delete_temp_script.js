const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'scripts', 'update_auth_sp.js');

if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted ${filePath}`);
} else {
    console.log(`${filePath} not found`);
}

const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    console.log('Testando credenciais...');
    console.log('Cloud:', cloudinary.config().cloud_name);
    console.log('Key:', cloudinary.config().api_key);
    
    // Testa pingando o Cloudinary ou fazendo um upload fake (não é possível sem arquivo real)
    // Mas podemos usar a API de administração se disponível
    const res = await cloudinary.api.ping();
    console.log('Ping result:', res);
  } catch (err) {
    console.error('Falha no teste:', err.message);
    if (err.http_code) console.error('Status:', err.http_code);
  }
}

test();

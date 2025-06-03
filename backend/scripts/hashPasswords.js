const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123';
  
  // Generar varios hashes para los usuarios de prueba
  for (let i = 0; i < 7; i++) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Hash ${i + 1}: ${hash}`);
  }
  
  // Verificar que funciona
  const testHash = await bcrypt.hash(password, 10);
  const isValid = await bcrypt.compare(password, testHash);
  console.log('\n✅ Verificación:', isValid);
  console.log('🔐 Hash de prueba:', testHash);
}

generateHashes().catch(console.error);
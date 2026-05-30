require('dotenv').config();

const twilio = require('twilio');
const { pool } = require('../config/db');

const accountSid =
  process.env.TWILIO_ACCOUNT_SID ||
  process.env.TWILIO_SID ||
  process.env.ACCOUNT_SID;

const authToken =
  process.env.TWILIO_AUTH_TOKEN ||
  process.env.AUTH_TOKEN;

async function clearLocalDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('\n🗄️ Limpiando registros locales de llamadas...');

    await connection.beginTransaction();

    await connection.execute('DELETE FROM decision_logs');
    await connection.execute('DELETE FROM calls');

    await connection.execute('ALTER TABLE decision_logs AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE calls AUTO_INCREMENT = 1');

    await connection.commit();

    console.log('✅ Base de datos local limpia.');
    console.log('   - decision_logs vacío');
    console.log('   - calls vacío');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function clearTwilioCalls() {
  if (!accountSid || !authToken) {
    console.log('\n⚠️ No se encontraron credenciales de Twilio en el .env.');
    console.log('   Se limpiará solo la base de datos local.');
    console.log('   Revisa que existan TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN.');
    return;
  }

  console.log('\n☎️ Consultando llamadas en Twilio...');

  const client = twilio(accountSid, authToken);

  const calls = await client.calls.list({
    limit: 1000
  });

  if (!calls.length) {
    console.log('✅ No hay llamadas en Twilio para borrar.');
    return;
  }

  console.log(`Se encontraron ${calls.length} llamada(s) en Twilio.`);

  let deleted = 0;
  let failed = 0;

  for (const call of calls) {
    try {
      await client.calls(call.sid).remove();
      deleted += 1;
      console.log(`✅ Borrada de Twilio: ${call.sid}`);
    } catch (error) {
      failed += 1;
      console.log(`❌ No se pudo borrar ${call.sid}: ${error.message}`);
    }
  }

  console.log('\nResumen Twilio:');
  console.log(`   Borradas: ${deleted}`);
  console.log(`   Fallidas: ${failed}`);
}

async function main() {
  try {
    console.log('======================================');
    console.log(' LIMPIEZA DE LLAMADAS PARA PRUEBA CERO');
    console.log('======================================');

    await clearTwilioCalls();
    await clearLocalDatabase();

    console.log('\n✅ Limpieza terminada correctamente.');
    console.log('Ahora puedes probar llamadas desde cero.');
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
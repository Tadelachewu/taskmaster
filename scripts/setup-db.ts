import 'dotenv/config'; // To load .env file
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : undefined,
});

async function setupDatabase() {
  // First, check if the environment variable is set at all. This gives the best error message.
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable not set.');
    console.log('Please add your full PostgreSQL connection string to the .env file and try again.');
    process.exit(1);
  }

  let client;
  try {
    console.log('Connecting to the database...');
    client = await pool.connect();
    console.log('Successfully connected.');

    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Error: Schema file not found at ${schemaPath}`);
        console.log('Please ensure the `sql/schema.sql` file exists in your project root.');
        process.exit(1);
    }
    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Split the file into individual statements, handling comments and empty lines.
    const statements = schemaSQL.split(/;\s*$/m).filter(statement => {
        // remove comments and trim
        const cleanStatement = statement.replace(/--.*$/gm, '').trim();
        return cleanStatement.length > 0;
    });

    if (statements.length === 0) {
        console.warn('⚠️ No SQL statements found in schema.sql. Nothing to execute.');
        return;
    }

    console.log(`Found ${statements.length} SQL statements to execute.`);

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 70).replace(/\n/g, ' ')}...`);
        await client.query(statement);
    }

    console.log('✅ Database setup complete. All tables and functions have been created.');
  } catch (error) {
    console.error('❌ Error setting up the database:', error);
    // Suggest common issues
    console.log('\nPlease check the following:');
    console.log('1. Your DATABASE_URL in the .env file is correct.');
    console.log('2. The database server is running and accessible.');
    console.log('3. The user has permissions to CREATE tables.');
    process.exit(1); // Exit with an error code
  } finally {
    if (client) {
      console.log('Closing database connection.');
      await client.release();
    }
    // Always end the pool to prevent the script from hanging.
    await pool.end();
  }
}

setupDatabase();

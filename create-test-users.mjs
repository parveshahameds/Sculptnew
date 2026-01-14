import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_PUBLIC_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('Creating test users...');

  // User 1
  const user1 = {
    email: 'user-test1@gmail.com',
    password: 'user-test1@123',
  };

  // User 2
  const user2 = {
    email: 'user-test2@gmail.com',
    password: 'user-test2@123',
  };

  try {
    // Create User 1
    console.log('\n📧 Creating user 1:', user1.email);
    const { data: userData1, error: error1 } = await supabase.auth.signUp({
      email: user1.email,
      password: user1.password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error1) {
      console.error('❌ Error creating user 1:', error1.message);
    } else {
      console.log('✅ User 1 created successfully!');
      console.log('   User ID:', userData1.user?.id);
      console.log('   Email:', userData1.user?.email);
    }

    // Create User 2
    console.log('\n📧 Creating user 2:', user2.email);
    const { data: userData2, error: error2 } = await supabase.auth.signUp({
      email: user2.email,
      password: user2.password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error2) {
      console.error('❌ Error creating user 2:', error2.message);
    } else {
      console.log('✅ User 2 created successfully!');
      console.log('   User ID:', userData2.user?.id);
      console.log('   Email:', userData2.user?.email);
    }

    console.log('\n✨ Test users creation process completed!');
    console.log('\nCredentials:');
    console.log('User 1 - Email:', user1.email, '| Password:', user1.password);
    console.log('User 2 - Email:', user2.email, '| Password:', user2.password);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestUsers();

import { supabaseAdmin } from '../lib/supabase';
import { db } from '../db/client';
import { organizations, organizationMembers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getEnv } from '../env';

const env = getEnv();

const DEMO_USERS = [
  {
    email: 'hr@admin.com',
    password: 'hr@admin',
    role: 'HR_ADMIN',
    name: 'HR Admin Demo',
  },
  {
    email: 'recruiter@admin.com',
    password: 'recruiter@admin',
    role: 'RECRUITER',
    name: 'Recruiter Demo',
  },
  {
    email: 'employee@test.com',
    password: 'employee@test',
    role: 'EMPLOYEE',
    name: 'Employee Demo',
  },
];

async function createDemoUsers() {
  console.log('Creating demo users and organization...\n');

  try {
    // 1. Create demo organization
    console.log('📦 Creating demo organization...');
    const [demoOrg] = await db
      .insert(organizations)
      .values({
        name: 'Demo Company',
        domain: 'demo.hirely.com',
      })
      .returning();

    if (!demoOrg) {
      throw new Error('Failed to create demo organization');
    }
    console.log(`✅ Organization created: ${demoOrg.name} (ID: ${demoOrg.id})\n`);

    // 2. Create users
    for (const user of DEMO_USERS) {
      console.log(`👤 Creating user: ${user.email} (${user.role})...`);

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find((u) => u.email === user.email);

        let userId: string;

        if (existingUser) {
          console.log(`   ⚠️  User already exists, updating...`);
          userId = existingUser.id;

          // Update user metadata
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: user.role },
            app_metadata: { role: user.role },
          });
        } else {
          // Create new user
          const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { role: user.role },
            app_metadata: { role: user.role },
          });

          if (error || !newUser.user) {
            console.log(`   ❌ Failed: ${error?.message}`);
            continue;
          }

          userId = newUser.user.id;
          console.log(`   ✅ User created (ID: ${userId})`);
        }

        // Add user to organization
        const existingMembers = await db
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.userId, userId));

        if (existingMembers.length === 0) {
          await db.insert(organizationMembers).values({
            organizationId: demoOrg.id,
            userId,
            role: user.role as any,
          });
          console.log(`   ✅ Added to organization with role: ${user.role}`);
        } else {
          console.log(`   ℹ️  Already a member of an organization`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      console.log('');
    }

    console.log('🎉 Demo users setup complete!\n');
    console.log('Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    DEMO_USERS.forEach((user) => {
      console.log(`${user.role.padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

createDemoUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

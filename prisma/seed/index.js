require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const logger = require('../../src/utils/logger');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
    try {
        logger.info(' Starting seed...');

        // Clear existing data (in development)
        if (process.env.NODE_ENV === 'development') {
            await prisma.$executeRaw`TRUNCATE TABLE "audit_logs" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "time_logs" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "task_comments" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "tasks" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "projects" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "password_reset_tokens" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "organization_settings" CASCADE;`;
            await prisma.$executeRaw`TRUNCATE TABLE "organizations" CASCADE;`;
            logger.info(' Created database');
        }

        // Hash passwords
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash('Admin@123', saltRounds);

        // Create organizations
        const organizations = await Promise.all([
            prisma.organization.create({
                data: {
                    name: 'Studio X',
                    slug: 'studio-x',
                    contact_email: 'admin@studiotraffic.com',
                    status: 'active',
                    settings: {
                        defaultTimezone: 'UTC',
                        dateFormat: 'MM/DD/YYYY',
                        timeFormat: '12h'
                    }
                }
            }),
            prisma.organization.create({
                data: {
                    name: 'Creative Hub',
                    slug: 'creative-hub',
                    contact_email: 'admin@creativehub.com',
                    status: 'active',
                    settings: {
                        defaultTimezone: 'UTC',
                        dateFormat: 'MM/DD/YYYY',
                        timeFormat: '12h'
                    }
                }
            }),
            prisma.organization.create({
                data: {
                    name: 'Vision Media',
                    slug: 'vision-media',
                    contact_email: 'admin@visionmedia.com',
                    status: 'active',
                    settings: {
                        defaultTimezone: 'UTC',
                        dateFormat: 'MM/DD/YYYY',
                        timeFormat: '12h'
                    }
                }
            })
        ]);

        logger.info(` Created ${organizations.length} organizations`);

        // Create organization settings
        await Promise.all(organizations.map((org, index) => {
            const colors = [
                { primary: '#2563EB', secondary: '#7C3AED' },
                { primary: '#DC2626', secondary: '#F59E0B' },
                { primary: '#059669', secondary: '#06B6D4' }
            ];
            return prisma.organizationSettings.create({
                data: {
                    organization_id: org.id,
                    brand_color: colors[index].primary,
                    brand_secondary: colors[index].secondary,
                    allow_self_registration: true,
                    require_email_verification: false,
                    task_assignment_email: true,
                    task_deadline_reminder: true,
                    project_update_email: true,
                    currency: 'USD'
                }
            });
        }));

        logger.info(' Created organization settings');

        // Create super admin
        const superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@studiotraffic.com',
                password: hashedPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: 'super_admin',
                status: 'active',
                organization_id: organizations[0].id
            }
        });

        logger.info(' Created super admin');

        // Create organization admins and team members
        for (const org of organizations) {
            // Org Admin
            await prisma.user.create({
                data: {
                    email: `admin@${org.slug}.com`,
                    password: hashedPassword,
                    first_name: 'Org',
                    last_name: 'Admin',
                    role: 'org_admin',
                    status: 'active',
                    organization_id: org.id
                }
            });

            // Team member 1
            await prisma.user.create({
                data: {
                    email: `john@${org.slug}.com`,
                    password: hashedPassword,
                    first_name: 'John',
                    last_name: 'Doe',
                    role: 'team_member',
                    status: 'active',
                    organization_id: org.id
                }
            });

            // Team member 2
            await prisma.user.create({
                data: {
                    email: `jane@${org.slug}.com`,
                    password: hashedPassword,
                    first_name: 'Jane',
                    last_name: 'Smith',
                    role: 'team_member',
                    status: 'active',
                    organization_id: org.id
                }
            });

            logger.info(`Created users for ${org.name}`);
        }

        logger.info(' Seed completed successfully!');

    } catch (error) {
        logger.error(' Seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed
seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('./database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const firstName = profile.name?.givenName || '';
                const lastName = profile.name?.familyName || '';
                const picture = profile.photos?.[0]?.value;

                if (!email) {
                    return done(new Error('No email provided by Google'), null);
                }

                logger.info(`Google auth attempt for: ${email}`);

                let user = await prisma.user.findFirst({
                    where: { email, deleted_at: null },
                    include: { organization: true },
                });

                if (!user) {
                    logger.info(`Creating new user for: ${email}`);

                    const tempPassword = crypto.randomBytes(16).toString('hex');
                    const hashedPassword = await bcrypt.hash(
                        tempPassword,
                        parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
                    );

                    const domain = email.split('@')[1];
                    const orgName = domain.split('.')[0].toUpperCase();

                    const orgSlug = `${orgName.toLowerCase()}-${crypto.randomBytes(4).toString('hex')}`;

                    user = await prisma.$transaction(async (tx) => {
                        const organization = await tx.organization.create({
                            data: {
                                name: `${orgName} Studio`,
                                slug: orgSlug,
                                contact_email: email,
                                status: 'active',
                            },
                        });

                        await tx.organizationSettings.create({
                            data: {
                                organization_id: organization.id,
                                brand_color: '#2563EB',
                                brand_secondary: '#7C3AED',
                                currency: 'USD',
                            },
                        });

                        const newUser = await tx.user.create({
                            data: {
                                email,
                                password: hashedPassword,
                                first_name: firstName || 'Google',
                                last_name: lastName || 'User',
                                profile_image: picture,
                                role: 'org_admin',
                                status: 'active',
                                organization_id: organization.id,
                            },
                            include: { organization: true },
                        });

                        await tx.auditLog.create({
                            data: {
                                organization_id: organization.id,
                                user_id: newUser.id,
                                action: 'google_auth_register',
                                entity_type: 'user',
                                entity_id: newUser.id,
                                changes: { email, provider: 'google' }
                            }
                        });

                        logger.info(`Created new user: ${email} with org: ${organization.name}`);
                        return newUser;
                    });

                } else {
                    if (picture && user.profile_image !== picture) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { profile_image: picture, last_login: new Date() }
                        });
                    } else {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { last_login: new Date() }
                        });
                    }
                    logger.info(`Existing user logged in via Google: ${email}`);
                }

                return done(null, user);
            } catch (error) {
                logger.error('Google auth error:', error);
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { organization: true },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
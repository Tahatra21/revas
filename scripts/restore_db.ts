
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || "postgres://jmaharyuda@localhost:5432/revas_db";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function restore() {
    console.log('Starting database restore...');

    const backupPath = path.join(process.cwd(), 'database', 'backup_full.json');

    if (!fs.existsSync(backupPath)) {
        console.error('❌ Backup file not found at:', backupPath);
        process.exit(1);
    }

    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    const { data } = JSON.parse(backupContent);

    try {
        // 1. Restore Users
        if (data.users?.length) {
            console.log(`Restoring ${data.users.length} Users...`);
            for (const user of data.users) {
                await prisma.users.upsert({
                    where: { username: user.username },
                    update: { ...user },
                    create: { ...user },
                });
            }
        }

        // 2. Restore Master SBU (Note: Assumes Regions exist or are optional/null for now)
        // If SBU restoration fails due to missing regions, we log it.
        if (data.masterSbu?.length) {
            console.log(`Restoring ${data.masterSbu.length} SBUs...`);
            for (const sbu of data.masterSbu) {
                try {
                    await prisma.master_sbu.upsert({
                        where: { code: sbu.code },
                        update: { ...sbu },
                        create: { ...sbu },
                    });
                } catch (e) {
                    console.warn(`Skipping SBU ${sbu.code} due to error (likely missing Region):`, e);
                }
            }
        }

        // 3. Restore Units (RPMS)
        if (data.units?.length) {
            console.log(`Restoring ${data.units.length} Units...`);
            // Sort by dependency (parents first) - simplified approach
            // Ideally we sort by hierarchy level or parentId null first
            const sortedUnits = data.units.sort((a, b) => (a.parentId || 0) - (b.parentId || 0));

            for (const unit of sortedUnits) {
                await prisma.unit.upsert({
                    where: { code: unit.code },
                    update: { ...unit },
                    create: { ...unit },
                });
            }
        }

        // 4. Restore Targets
        if (data.targets?.length) {
            console.log(`Restoring ${data.targets.length} Targets...`);
            // Using createMany for speed, skip duplicates
            await prisma.target.createMany({
                data: data.targets.map(t => ({ ...t, id: undefined })), // Let ID auto-increment or keep? usually keep but createMany conflicts on ID sometimes.
                // Actually, if we want to restore exact state, we should use upsert or explicit IDs.
                // For simplicity/bulk: delete existing for these units/months? 
                // Let's use loop upsert for safety.
                skipDuplicates: true
            });
            // Loop backup for updates
            /* 
            for (const t of data.targets) {
                // Unique key: year_month_unitId_targetType
                // Upsert can be complex with composite unique keys in some Prisma versions if not fully defined in schema type
                // Schema has @@unique([year, month, unitId, targetType])
                await prisma.target.upsert({
                    where: { year_month_unitId_targetType: { year: t.year, month: t.month, unitId: t.unitId, targetType: t.targetType } },
                    update: t,
                    create: t
                })
            }
            */
        }

        // 5. Restore Actuals
        if (data.actuals?.length) {
            console.log(`Restoring ${data.actuals.length} Actuals...`);
            await prisma.actual.createMany({
                data: data.actuals.map(a => ({ ...a, id: undefined })),
                skipDuplicates: true
            });
        }

        // 6. System Settings
        if (data.systemSettings?.length) {
            console.log(`Restoring ${data.systemSettings.length} Settings...`);
            for (const s of data.systemSettings) {
                await prisma.systemSetting.upsert({
                    where: { key: s.key },
                    update: s,
                    create: s
                });
            }
        }

        console.log('✅ Restore completed successfully!');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restore();

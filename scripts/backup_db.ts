
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('Starting database backup...');

    try {
        const users = await prisma.users.findMany();
        const masterSbu = await prisma.master_sbu.findMany();
        const units = await prisma.unit.findMany();
        const targets = await prisma.target.findMany();
        const actuals = await prisma.actual.findMany();
        const activityLogs = await prisma.activityLog.findMany();
        const systemSettings = await prisma.systemSetting.findMany();

        const backupData = {
            timestamp: new Date().toISOString(),
            counts: {
                users: users.length,
                masterSbu: masterSbu.length,
                units: units.length,
                targets: targets.length,
                actuals: actuals.length,
                activityLogs: activityLogs.length,
                systemSettings: systemSettings.length,
            },
            data: {
                users,
                masterSbu,
                units,
                targets,
                actuals,
                activityLogs,
                systemSettings,
            },
        };

        const backupDir = path.join(process.cwd(), 'database');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const filename = `backup_full.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        console.log(`✅ Backup successful! Saved to ${filepath}`);
        console.log('Summary:', backupData.counts);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backup();

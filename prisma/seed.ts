import { PrismaClient, UnitLevel, TargetType } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://jmaharyuda@localhost:5432/revas_db"
        }
    }
});

async function main() {
    console.log('Seeding RPMS data...');

    // 1. Create SBUs
    const sbus = [
        { name: 'SBU 1', code: 'SBU1' },
        { name: 'SBU 2', code: 'SBU2' },
        { name: 'SBU 3', code: 'SBU3' },
    ];

    for (const s of sbus) {
        const unit = await prisma.unit.upsert({
            where: { code: s.code },
            update: {},
            create: {
                name: s.name,
                code: s.code,
                level: UnitLevel.SBU,
            },
        });
        console.log(`Upserted Unit: ${unit.code}`);

        // 2. Create Targets for 2025 (Sample)
        // Jan-Dec 2025
        for (let month = 1; month <= 12; month++) {
            // RKAP
            await prisma.target.upsert({
                where: {
                    year_month_unitId_targetType: {
                        year: 2025,
                        month,
                        unitId: unit.id,
                        targetType: TargetType.RKAP,
                    }
                },
                update: {},
                create: {
                    year: 2025,
                    month,
                    unitId: unit.id,
                    targetType: TargetType.RKAP,
                    amount: 1000, // Sample amount 1B
                },
            });

            // BEYOND
            await prisma.target.upsert({
                where: {
                    year_month_unitId_targetType: {
                        year: 2025,
                        month,
                        unitId: unit.id,
                        targetType: TargetType.BEYOND_RKAP,
                    }
                },
                update: {},
                create: {
                    year: 2025,
                    month,
                    unitId: unit.id,
                    targetType: TargetType.BEYOND_RKAP,
                    amount: 1200,
                },
            });
        }
    }

    // 3. Create sample divisions for SBU 1
    const sbu1 = await prisma.unit.findUnique({ where: { code: 'SBU1' } });
    if (sbu1) {
        await prisma.unit.upsert({
            where: { code: 'DIV1-SBU1' },
            update: {},
            create: {
                name: 'Division 1',
                code: 'DIV1-SBU1',
                level: UnitLevel.DIVISION,
                parentId: sbu1.id,
            },
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

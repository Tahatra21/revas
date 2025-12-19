
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const units = await prisma.unit.findMany({
        where: { code: { contains: 'KONFRA' } },
        include: { targets: true }
    });

    for (const unit of units) {
        console.log(`Unit: ${unit.name} (${unit.code})`);

        const rkap2025 = unit.targets
            .filter(t => t.targetType === 'RKAP' && t.year === 2025)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        console.log(`Calculated RKAP 2025 (Sum of Months): ${rkap2025.toFixed(2)}`);
    }
}

main().finally(() => prisma.$disconnect());

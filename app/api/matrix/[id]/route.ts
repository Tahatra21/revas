import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const id = Number(params.id);
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    if (!id) {
        return NextResponse.json({ error: "Invalid Unit ID" }, { status: 400 });
    }

    try {
        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                targets: { where: { year } },
                actuals: { where: { year } },
                sbu: true // Include SBU details if needed
            }
        });

        if (!unit) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        // Construct 1-12 month data
        const monthlyData = [];
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        for (let m = 1; m <= 12; m++) {
            // Find metrics for this month
            const getAmount = (arr: any[], type?: string) => {
                const item = arr.find(x => x.month === m && (!type || x.targetType === type));
                return item ? Number(item.amount) : 0;
            };

            const rkap = getAmount(unit.targets, 'RKAP');
            const beyond = getAmount(unit.targets, 'BEYOND_RKAP');
            const commitment = getAmount(unit.targets, 'COMMITMENT');
            const nr = getAmount(unit.targets, 'NR');
            const actual = getAmount(unit.actuals); // Actual has no targetType

            monthlyData.push({
                month: m,
                monthName: months[m - 1],
                rkap,
                beyond,
                commitment,
                nr,
                actual
            });
        }

        return NextResponse.json({
            unit: {
                id: unit.id,
                name: unit.name,
                code: unit.code,
                sbuName: unit.sbu?.name || unit.name
            },
            monthlyData
        });

    } catch (error) {
        console.error("Matrix Detail API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

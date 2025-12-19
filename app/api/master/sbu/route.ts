import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const rows = await prisma.master_sbu.findMany({
            orderBy: { code: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
                is_active: true
            }
        });

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching SBUs:", error);
        return NextResponse.json(
            { message: "Failed to fetch SBUs" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.code || !body.name) {
            return NextResponse.json(
                { message: "code and name are required" },
                { status: 400 }
            );
        }

        const newSbu = await prisma.master_sbu.create({
            data: {
                code: body.code,
                name: body.name,
                is_active: body.is_active ?? true
            },
            select: {
                id: true,
                code: true,
                name: true,
                is_active: true
            }
        });

        return NextResponse.json(newSbu, { status: 201 });
    } catch (error: any) {
        console.error("Error creating SBU:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { message: "SBU code already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Failed to create SBU" },
            { status: 500 }
        );
    }
}

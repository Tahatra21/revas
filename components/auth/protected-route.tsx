"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip auth check for login page
        if (pathname === "/login") {
            return;
        }

        // Check if user is authenticated
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
            // Redirect to login if not authenticated
            router.push("/login");
        }
    }, [pathname, router]);

    return <>{children}</>;
}

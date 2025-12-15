import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LayoutContent } from "@/components/layout/layout-content";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Revas - Revenue Monitoring Application",
    description: "Revenue Monitoring Application for PLN Group",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen">
                <ToastProvider>
                    <ProtectedRoute>
                        <LayoutContent>{children}</LayoutContent>
                    </ProtectedRoute>
                </ToastProvider>
            </body>
        </html>
    );
}

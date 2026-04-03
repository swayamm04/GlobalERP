import { Providers } from "./providers";
import "./globals.css";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Vasantha Metal Industry",
        template: "%s | Vasantha Metal Industry",
    },
    description: "Enterprise Inventory Management System",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

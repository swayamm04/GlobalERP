import { Providers } from "./providers";
import "./globals.css";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Metal Industry App",
        template: "%s | Metal Industry App",
    },
    description: "Enterprise Inventory Management System",
    icons: {
        icon: "/icon.svg",
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

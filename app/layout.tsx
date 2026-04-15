import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horion",
  description: "Gestión operativa hotelera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <header className="app-header">
          <div className="app-container app-header-inner">
            <Link href="/" className="app-brand">
              <Image
                src="/logo-horion.png"
                alt="Horion"
                width={44}
                height={44}
                className="app-brand-logo"
                priority
              />
              <div className="app-brand-copy">
                <span className="app-brand-text">Horion</span>
                <span className="app-brand-subtitle">
                  Gestión operativa hotelera
                </span>
              </div>
            </Link>

            <nav className="app-topnav" aria-label="Principal">
              <Link href="/maestros" className="app-topnav-link">
                Maestros
              </Link>
              <Link href="/maestros/empleados" className="app-topnav-link">
                Empleados
              </Link>
              <Link href="/maestros/usuarios" className="app-topnav-link">
                Usuarios
              </Link>
              <Link href="/turnos" className="app-topnav-link">
                Turnos
              </Link>
            </nav>
          </div>
        </header>

        <div className="app-main">{children}</div>
      </body>
    </html>
  );
}
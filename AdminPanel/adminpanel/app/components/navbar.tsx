"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Community", href: "/community" },
    { label: "Premium", href: "/premium" },
    { label: "Challanges", href: "/challanges" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="bg-black text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Hoop Master Admin</h1>
        <ul className="flex space-x-4">
          {navItems.map((item) => (
            <li
              key={item.href}
              className={`${
                pathname === item.href ? "underline" : ""
              } hover:text-gray-300`}
            >
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

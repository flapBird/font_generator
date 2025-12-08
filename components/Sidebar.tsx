'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { tools } from '@/lib/fonts';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
          Tools
        </h3>
        {tools.map((tool) => {
          const isActive = pathname === tool.href;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="relative block"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
              <div className={`relative flex items-center space-x-3 px-3 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}>
                <span className="text-xl">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

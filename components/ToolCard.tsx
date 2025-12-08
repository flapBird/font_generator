'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  gradient?: string;
}

export default function ToolCard({ title, description, icon, href, gradient = 'from-primary to-accent' }: ToolCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl bg-background border border-border p-6 transition-shadow hover:shadow-xl"
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
        
        {/* Icon */}
        <div className="relative mb-4 text-4xl">{icon}</div>
        
        {/* Content */}
        <div className="relative">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div className="relative mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Get Started</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}

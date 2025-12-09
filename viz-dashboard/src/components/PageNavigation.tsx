'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Target, Zap, Globe, Swords } from 'lucide-react';

const sections = [
  { id: 'dashboard', label: 'The Meta Web', icon: LayoutDashboard },
  { id: 'sleeper-hunt', label: 'Sleeper Hunt', icon: Target },
  { id: 'tempo-analysis', label: 'Tempo Analysis', icon: Zap },
  { id: 'regional-playstyles', label: 'Regional Playstyles', icon: Globe },
  { id: 'archetype-matchups', label: 'Archetype Matchups', icon: Swords },
];

export default function PageNavigation() {
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -50% 0px', // Trigger when section is near top/middle
        threshold: 0.1,
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className="hidden lg:block sticky top-24 h-fit w-64 space-y-1">
      <div className="text-xs font-bold text-gray-500 uppercase mb-4 px-4 tracking-wider">
        On This Page
      </div>
      {sections.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => scrollToSection(id)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeSection === id
              ? 'bg-white/10 text-white shadow-lg border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className={`w-4 h-4 ${activeSection === id ? 'text-purple-400' : ''}`} />
          {label}
        </button>
      ))}
    </nav>
  );
}

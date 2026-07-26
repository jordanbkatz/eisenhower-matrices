import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import siteData from '../siteData.js';

const navItems = [
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg/85 backdrop-blur-md border-b border-line shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="font-display text-xl md:text-2xl text-navy-deep tracking-tight">
          <span className="font-semibold">J M</span>
          <span className="text-gold mx-1">·</span>
          <span>Rubin</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-ink/80 hover:text-navy transition-colors">
              {item.label}
            </a>
          ))}
          <a
            href={`tel:${siteData.contactInfo.phoneNumber.replace(/\D/g, '')}`}
            className="text-sm font-semibold bg-navy text-white px-5 py-2.5 rounded-full hover:bg-navy-deep transition-colors"
          >
            {siteData.contactInfo.phoneNumber}
          </a>
        </nav>
        <button className="md:hidden text-navy-deep" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <HiX size={26} /> : <HiMenu size={26} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-bg border-t border-line">
          <nav className="px-6 py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="text-base font-medium text-ink/80 hover:text-navy">
                {item.label}
              </a>
            ))}
            <a href={`tel:${siteData.contactInfo.phoneNumber.replace(/\D/g, '')}`} className="mt-2 text-center bg-navy text-white px-5 py-3 rounded-full font-semibold">
              {siteData.contactInfo.phoneNumber}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

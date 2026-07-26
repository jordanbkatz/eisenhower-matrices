import { useState } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import siteData from '../../siteData.js';

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const subject = encodeURIComponent(form.get('subject') || 'Inquiry');
    const body = encodeURIComponent(
      `Name: ${form.get('name')}\nEmail: ${form.get('email')}\n\n${form.get('message')}`
    );
    window.location.href = `mailto:${siteData.contactInfo.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20">
        <div>
          <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">Get in Touch</span>
          <h2 className="font-display text-4xl md:text-5xl text-navy-deep mt-3 mb-6 leading-tight">
            Discuss your matter in confidence
          </h2>
          <p className="text-muted leading-relaxed mb-10 max-w-md">
            For arbitration appointments, mediation requests, or consulting inquiries,
            please reach out directly or use the form.
          </p>
          <ul className="space-y-5">
            <li className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-navy/5 text-navy flex items-center justify-center"><FaPhoneAlt /></span>
              <a href={`tel:${siteData.contactInfo.phoneNumber.replace(/\D/g, '')}`} className="text-ink hover:text-navy font-medium">{siteData.contactInfo.phoneNumber}</a>
            </li>
            <li className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-navy/5 text-navy flex items-center justify-center"><FaEnvelope /></span>
              <a href={`mailto:${siteData.contactInfo.email}`} className="text-ink hover:text-navy font-medium">{siteData.contactInfo.email}</a>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-11 h-11 rounded-full bg-navy/5 text-navy flex items-center justify-center flex-shrink-0"><FaMapMarkerAlt /></span>
              <span className="text-ink pt-2">{siteData.location.address}</span>
            </li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl p-8 md:p-10 shadow-xl shadow-navy/5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field name="name" label="Name" required />
            <Field name="email" label="Email" type="email" required />
          </div>
          <Field name="subject" label="Subject" required />
          <Field name="message" label="Message" textarea required />
          <button type="submit" className="w-full bg-navy text-white py-3.5 rounded-full font-semibold hover:bg-navy-deep transition-colors">
            {sent ? 'Thank you — opening email…' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ name, label, type = 'text', textarea = false, required }) {
  const cls = "w-full bg-bg border border-line rounded-lg px-4 py-3 text-ink placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10 transition";
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted font-medium mb-1.5 block">{label}</span>
      {textarea ? (
        <textarea name={name} rows={5} required={required} className={cls} />
      ) : (
        <input name={name} type={type} required={required} className={cls} />
      )}
    </label>
  );
}

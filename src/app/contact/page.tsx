"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.887-9.885 9.887m0-18.232C6.31 3.553 1.93 7.934 1.928 13.286c0 1.91.55 3.774 1.593 5.378l-1.692 6.18 6.326-1.659a11.66 11.66 0 005.57 1.416h.005c5.352 0 9.734-4.382 9.736-9.735 0-2.6-1.02-5.045-2.879-6.903a9.67 9.67 0 00-6.908-2.859" />
    </svg>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the message for WhatsApp
    const waNumber = "919446640824";
    const text = `*New Contact Form Inquiry*\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone}\n*Subject:* ${formData.subject}\n\n*Message:*\n${formData.message}`;
    
    // Create the WhatsApp deep link
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    
    // Open WhatsApp in a new tab
    window.open(waUrl, "_blank");

    // Mark as submitted and clear form
    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
  };

  return (
    <div className="bg-brand-cream min-h-screen pb-24">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 md:px-12 container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full border border-brand-primary/30 text-brand-dark font-button text-sm mb-4 bg-white/50 backdrop-blur-sm">
            We'd Love to Hear From You
          </span>
          <h1 className="font-heading text-5xl md:text-6xl text-brand-dark mb-6">Contact Us</h1>
          <p className="font-sans text-brand-text/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Have questions about our products, orders, or trade inquiries? Reach out to our dedicated team.
          </p>
        </motion.div>
      </section>

      {/* Main Grid */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Address Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark mb-2">Our Office & Unit</h3>
                  <p className="font-sans text-brand-text/80 text-sm leading-relaxed">
                    11/280 A Medammal Building<br />
                    Ashupathri Padi, Vaniyannur<br />
                    Iringavoor PO, Tirur<br />
                    Malappuram, Kerala – 676103
                  </p>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark mb-2">Email Us</h3>
                  <div className="font-sans text-sm space-y-1">
                    <p className="text-brand-text/60 text-xs font-semibold uppercase tracking-wider">General Inquiries</p>
                    <a href="mailto:info@flavorhousefoods.com" className="text-brand-primary font-medium hover:underline block">
                      info@flavorhousefoods.com
                    </a>
                    
                    <p className="text-brand-text/60 text-xs font-semibold uppercase tracking-wider pt-2">Sales & Business</p>
                    <a href="mailto:sales@flavorhousefoods.com" className="text-brand-primary font-medium hover:underline block">
                      sales@flavorhousefoods.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone & WhatsApp Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark mb-2">Call & WhatsApp</h3>
                  <a href="tel:+919446640824" className="font-sans text-brand-dark text-lg font-bold hover:text-brand-primary transition-colors block mb-3">
                    +91 94466 40824
                  </a>
                  
                  <a
                    href="https://wa.me/919446640824"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full font-button text-xs uppercase tracking-wider hover:bg-[#20ba5a] transition-all"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    Instant WhatsApp Chat
                  </a>
                </div>
              </div>
            </div>

            {/* Social Media Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border">
              <h3 className="font-heading text-xl font-bold text-brand-dark mb-4">Follow Us</h3>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.facebook.com/share/17rmar29kM/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-cream border border-brand-border text-brand-dark font-button text-sm hover:bg-brand-primary hover:text-white transition-all"
                >
                  <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/flavorhouse.in?igsh=bGY2aWhpeWM1NHBj&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-cream border border-brand-border text-brand-dark font-button text-sm hover:bg-brand-primary hover:text-white transition-all"
                >
                  <InstagramIcon className="w-5 h-5 text-[#E4405F]" />
                  Instagram
                </a>
                <a
                  href="https://youtube.com/@flavorhousefoods?si=nwsDzLaJsmPDj0rD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-cream border border-brand-border text-brand-dark font-button text-sm hover:bg-brand-primary hover:text-white transition-all"
                >
                  <YoutubeIcon className="w-5 h-5 text-[#FF0000]" />
                  YouTube
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-brand-border">
            <h2 className="font-heading text-3xl font-bold text-brand-dark mb-2">Send Us a Message</h2>
            <p className="font-sans text-brand-text/70 text-sm mb-8">
              Fill out the form below and our team will get back to you within 24 hours.
            </p>

            {submitted ? (
              <div className="py-16 text-center bg-brand-cream/50 rounded-2xl border border-brand-border p-8">
                <CheckCircle2 className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-bold text-brand-dark mb-2">Thank You!</h3>
                <p className="font-sans text-brand-text/80">Your message has been received. We will be in touch shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-brand-primary font-button text-sm uppercase underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-brand-dark mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-brand-dark mb-2">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-brand-dark mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-brand-dark mb-2">
                      Department / Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    >
                      <option value="General Inquiry">General Inquiry (info@flavorhousefoods.com)</option>
                      <option value="Sales & Distribution">Sales & Wholesale (sales@flavorhousefoods.com)</option>
                      <option value="Product Support">Product Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-brand-dark mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-white font-button uppercase tracking-wider py-4 rounded-xl hover:bg-brand-dark transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

export function Newsletter({ acf }: { acf?: any }) {
  return (
    <section className="py-32 relative overflow-hidden bg-brand-cream">
      {/* Background Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-sand rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
            {acf?.newsletter_badge || "Stay Connected"}
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-brand-dark mb-6">
            {acf?.newsletter_title_part_1 || "Join The Healthy"} <span className="italic font-subheading font-normal">{acf?.newsletter_title_part_2 || "Food Movement."}</span>
          </h2>
          <p className="font-sans text-brand-text/80 text-lg mb-12 max-w-xl mx-auto">
            {acf?.newsletter_description || "Subscribe to our newsletter for exclusive recipes, early access to new products, and tips for a wholesome lifestyle."}
          </p>

          <form className="flex flex-col sm:flex-row items-center gap-4 max-w-xl mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-grow w-full bg-white border border-brand-border rounded-full px-8 py-4 font-sans text-brand-dark placeholder:text-brand-text/50 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-sm"
              required
            />
            <button 
              type="submit"
              className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-full font-button text-sm uppercase tracking-wide hover:bg-brand-dark transition-colors shadow-lg hover:shadow-xl shrink-0"
            >
              Subscribe
            </button>
          </form>
          <p className="font-sans text-xs text-brand-text/50 mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

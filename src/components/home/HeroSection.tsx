"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection({ acf }: { acf?: any }) {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-brand-cream overflow-hidden">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/kraft-paper.png")' }}></div>
      
      {/* Organic Shapes Background */}
      <div className="absolute top-0 right-0 w-[50vw] h-[100vh] bg-brand-sand rounded-l-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[60vh] bg-[#E9DDC5] rounded-tr-full blur-[120px] opacity-40"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side Content */}
        <div className="max-w-2xl pt-10 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full border border-brand-primary/30 text-brand-dark font-button text-sm mb-6 bg-white/50 backdrop-blur-sm">
              {acf?.hero_badge || "Premium Organic Food"}
            </span>
            <h1 className="font-heading text-5xl md:text-7xl font-medium text-brand-dark leading-[1.1] mb-6">
              {acf?.hero_title_part_1 || "Rooted in Health."} <br className="hidden md:block" />
              <span className="text-brand-primary italic font-subheading">{acf?.hero_title_part_2 || "Rich in Flavour."}</span>
            </h1>
            <p className="text-lg md:text-xl text-brand-text/80 font-sans mb-10 leading-relaxed max-w-lg">
              {acf?.hero_description || "Discover premium organic foods made with wholesome ingredients and traditional goodness for modern lifestyles."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href={acf?.hero_button_1_link || "/products"} className="group flex items-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-full font-button text-sm uppercase tracking-wide hover:bg-brand-dark transition-all duration-300 shadow-[0_10px_30px_rgba(184,148,95,0.3)] hover:shadow-[0_15px_35px_rgba(110,84,50,0.4)]">
                {acf?.hero_button_1_text || "Shop Products"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href={acf?.hero_button_2_link || "/products"} className="flex items-center gap-2 px-8 py-4 rounded-full font-button text-sm uppercase tracking-wide text-brand-dark border border-brand-border hover:border-brand-primary hover:text-brand-primary transition-colors bg-white/30 backdrop-blur-sm">
                {acf?.hero_button_2_text || "Explore Categories"}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right Side Image/Composition */}
        <div className="relative h-[400px] lg:h-[600px] mt-12 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Using a high-quality unsplash image matching the description since image generation quota is exhausted */}
            <img 
              src={acf?.hero_image || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop"} 
              alt="Premium organic healthy food bowl with natural ingredients" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent"></div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-4 lg:-bottom-10 lg:-left-10 bg-white p-3 lg:p-4 rounded-2xl shadow-xl border border-brand-border backdrop-blur-md bg-white/90 z-10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center">
                <span className="text-2xl">{acf?.hero_floating_badge_icon || "🌿"}</span>
              </div>
              <div>
                <p className="font-heading font-bold text-brand-dark">{acf?.hero_floating_badge_title || "100% Natural"}</p>
                <p className="text-xs font-sans text-brand-text">{acf?.hero_floating_badge_subtitle || "Pure Nutrition"}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const BENEFITS = [
  "Rich in Dietary Fiber",
  "High Quality Protein",
  "Supports Better Digestion",
  "Low Glycemic Index (GI)",
  "Rich in Essential Minerals",
  "Sustainable Nutrition",
];

export function WhyMillets({ acf }: { acf?: any }) {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Illustration/Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-t-full rounded-b-[4rem] overflow-hidden bg-brand-cream relative z-10 border-8 border-white shadow-2xl">
              <img 
                src={acf?.why_millets_image || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=1080&auto=format&fit=crop"} 
                alt="Wholesome ingredients in a wooden bowl" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Background elements */}
            <div className="absolute top-10 -left-10 w-64 h-64 bg-brand-sand rounded-full -z-0"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-[#E9DDC5] rounded-full -z-0 blur-2xl"></div>

            {/* Floating Stat */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute top-1/4 -right-12 bg-white p-6 rounded-2xl shadow-xl z-20 border border-brand-border"
            >
              <p className="font-heading text-4xl font-bold text-brand-primary mb-1">{acf?.why_millets_floating_badge_title || "100%"}</p>
              <p className="font-sans text-sm text-brand-dark font-medium" dangerouslySetInnerHTML={{ __html: acf?.why_millets_floating_badge_subtitle || "Pure Organic <br/>Ingredients" }}></p>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
              {acf?.why_millets_badge || "Pure Nutrition"}
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-6 leading-tight">
              {acf?.why_millets_title_part_1 || "Rooted in Health."} <br />
              <span className="italic font-subheading font-normal">{acf?.why_millets_title_part_2 || "Rich in Flavour."}</span>
            </h2>
            <p className="font-sans text-brand-text/80 text-lg mb-10 leading-relaxed">
              {acf?.why_millets_description || "We believe in bringing the finest natural food items to modern dining tables. Packed with rich dietary fiber, essential nutrients, and clean organic ingredients, our products deliver authentic taste without compromise."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              {BENEFITS.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 group"
                >
                  <CheckCircle2 className="w-6 h-6 text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-brand-dark font-medium group-hover:text-brand-primary transition-colors">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-brand-border">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-brand-dark">100%</p>
                  <p className="font-sans text-sm text-brand-text/70 uppercase tracking-wide">Gluten Free</p>
                </div>
                <div className="w-px h-12 bg-brand-border"></div>
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-brand-dark">0%</p>
                  <p className="font-sans text-sm text-brand-text/70 uppercase tracking-wide">Preservatives</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

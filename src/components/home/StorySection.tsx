"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function StorySection({ acf }: { acf?: any }) {
  return (
    <section className="py-24 bg-brand-sand/30 overflow-hidden relative">
      <div className="absolute right-0 top-0 w-1/3 h-full bg-brand-cream -z-10 hidden lg:block"></div>
      
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <img 
              src={acf?.story_image || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1080&auto=format&fit=crop"} 
              alt="Authentic Kerala spices and ingredients" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-dark/10"></div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
              {acf?.story_badge || "Our Roots"}
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-8 leading-tight">
              {acf?.story_title_part_1 || "Rooted in Health."} <br />
              <span className="italic font-subheading font-normal">{acf?.story_title_part_2 || "Rich in Flavour."}</span>
            </h2>
            
            <div className="space-y-6 font-sans text-brand-text/80 text-lg leading-relaxed mb-10">
              <p>
                {acf?.story_paragraph_1 || "Flavor House was founded with a simple yet powerful mission: to bring wholesome, authentic quality foods to modern dining tables without compromising on taste."}
              </p>
              <p>
                {acf?.story_paragraph_2 || "We believe that pure food shouldn't be a compromise. By combining high quality natural ingredients with innovative recipes, we've created a range of products that are as delicious as they are nutritious."}
              </p>
            </div>

            <Link href={acf?.story_button_link || "/about"} className="group inline-flex items-center gap-2 font-button uppercase tracking-wide text-brand-dark hover:text-brand-primary transition-colors pb-1 border-b-2 border-brand-dark hover:border-brand-primary">
              {acf?.story_button_text || "Discover Our Story"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

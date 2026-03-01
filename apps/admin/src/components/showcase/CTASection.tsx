import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import {
  FaApple,
  FaGooglePlay,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaDiscord,
  FaTwitter,
} from 'react-icons/fa';
import { AppShowcaseData } from '@/types/app-showcase.types';

interface CTASectionProps {
  data: AppShowcaseData;
}

export const CTASection = ({ data }: CTASectionProps) => {
  return (
    <section className="py-20 bg-gradient-to-br from-dark-surface via-primary/10 to-dark-surface relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-neon-cyan rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4 font-display">
            {data.cta.heading}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            {data.cta.description}
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {/* App Store Button - Apple Style */}
            {data.downloads.appStore && (
              <motion.a
                href={data.downloads.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-6 rounded-xl bg-black text-white font-semibold flex items-center gap-3 hover:bg-gray-900 transition-all border border-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaApple size={32} />
                <div className="text-left">
                  <div className="text-[10px] font-normal">Tải trên</div>
                  <div className="text-base font-semibold -mt-0.5">App Store</div>
                </div>
              </motion.a>
            )}

            {/* Google Play Button - Google Style */}
            {data.downloads.googlePlay && (
              <motion.a
                href={data.downloads.googlePlay}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-6 rounded-xl bg-black text-white font-semibold flex items-center gap-3 hover:bg-gray-900 transition-all border border-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGooglePlay size={24} />
                <div className="text-left">
                  <div className="text-[10px] font-normal">Tải trên</div>
                  <div className="text-base font-semibold -mt-0.5">Google Play</div>
                </div>
              </motion.a>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" className="text-accent" />
              ))}
            </div>
            <span className="text-sm">
              {data.cta.rating.score} từ {data.cta.rating.totalUsers}
            </span>
          </div>

          {/* Social Media Links */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-semibold">Theo dõi chúng tôi trên</p>
            <div className="flex gap-4">
              {data.social.facebook && (
                <motion.a
                  href={data.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-neon-cyan hover:border-neon-cyan transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaFacebook size={24} />
                </motion.a>
              )}
              {data.social.instagram && (
                <motion.a
                  href={data.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-pink-500 hover:border-pink-500 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaInstagram size={24} />
                </motion.a>
              )}
              {data.social.youtube && (
                <motion.a
                  href={data.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-red-500 hover:border-red-500 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaYoutube size={24} />
                </motion.a>
              )}
              {data.social.tiktok && (
                <motion.a
                  href={data.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-white hover:border-white transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTiktok size={20} />
                </motion.a>
              )}
              {data.social.discord && (
                <motion.a
                  href={data.social.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-indigo-400 hover:border-indigo-400 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaDiscord size={24} />
                </motion.a>
              )}
              {data.social.twitter && (
                <motion.a
                  href={data.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-blue-400 hover:border-blue-400 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTwitter size={22} />
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

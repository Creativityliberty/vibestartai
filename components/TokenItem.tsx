
import React from 'react';
import { motion } from 'framer-motion';
import { TOKEN_ICONS } from '../constants';

interface TokenItemProps {
  iconKey: keyof typeof TOKEN_ICONS;
  label: string;
  value: string;
  delay?: number;
}

export const TokenItem: React.FC<TokenItemProps> = ({ iconKey, label, value, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-[#FDEEEB] dark:hover:bg-[#E6644C]/10 transition-colors group shadow-sm"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white shadow-sm flex items-center justify-center text-[#E6644C] group-hover:scale-110 transition-transform border border-slate-100 dark:border-transparent">
        {TOKEN_ICONS[iconKey]}
      </div>
      <span className="text-[10px] font-black text-slate-500 dark:text-[#9A9A9A] uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate max-w-[120px]" title={value}>
      {value}
    </span>
  </motion.div>
);

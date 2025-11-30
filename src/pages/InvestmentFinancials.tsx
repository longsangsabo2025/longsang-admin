import { motion } from "framer-motion";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { projectsData } from "@/data/projects-data";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Calendar,
  Download,
  Calculator,
  BarChart3,
  Target
} from "lucide-react";

const InvestmentFinancials = () => {
  const { slug } = useParams();
  const project = projectsData.find((p) => p.slug === slug);
  
  // ROI Calculator State
  const [investmentAmount, setInvestmentAmount] = useState<number>(100000000); // 100M VNĐ
  const [investmentYears, setInvestmentYears] = useState<number>(3);

  // Mock Financial Data - sẽ được thay thế bằng real data từ investment-data.ts
  const revenueProjections = [
    { year: 2024, revenue: 500000, profit: -200000, users: 10000 },
    { year: 2025, revenue: 5000000, profit: 500000, users: 100000 },
    { year: 2026, revenue: 20000000, profit: 4000000, users: 500000 },
    { year: 2027, revenue: 50000000, profit: 12000000, users: 1000000 },
    { year: 2028, revenue: 100000000, profit: 30000000, users: 2000000 },
  ];

  const useOfFunds = [
    { category: "Product Development", percentage: 40, amount: 20000000000, color: "from-blue-500 to-cyan-500" },
    { category: "Marketing & Sales", percentage: 30, amount: 15000000000, color: "from-purple-500 to-pink-500" },
    { category: "Team & Operations", percentage: 20, amount: 10000000000, color: "from-yellow-500 to-orange-500" },
    { category: "Infrastructure & Tech", percentage: 10, amount: 5000000000, color: "from-green-500 to-emerald-500" },
  ];

  // ROI Calculator
  const calculateROI = () => {
    const expectedMultiplier = investmentYears === 3 ? 3 : investmentYears === 5 ? 5 : 4;
    const totalReturn = investmentAmount * expectedMultiplier;
    const profit = totalReturn - investmentAmount;
    const annualReturn = (profit / investmentAmount / investmentYears) * 100;
    
    return {
      totalReturn,
      profit,
      annualReturn: annualReturn.toFixed(2),
      multiplier: expectedMultiplier
    };
  };

  const roi = calculateROI();

  // Format currency VNĐ
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} tỷ VNĐ`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} triệu VNĐ`;
    }
    return `${amount.toLocaleString()} VNĐ`;
  };

  const formatUSD = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-6">
          <BarChart3 className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">Financial Projections</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
          Dự Báo Tài Chính
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Phân tích chi tiết về doanh thu, lợi nhuận và lợi tức đầu tư dự kiến trong 5 năm tới
        </p>
      </motion.div>

      {/* Revenue Projections Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <GlowCard color="yellow" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">Dự Báo Doanh Thu & Lợi Nhuận</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Năm</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Doanh Thu</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Lợi Nhuận</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Người Dùng</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Tăng Trưởng</th>
                </tr>
              </thead>
              <tbody>
                {revenueProjections.map((year, index) => {
                  const growth = index > 0 
                    ? ((year.revenue - revenueProjections[index - 1].revenue) / revenueProjections[index - 1].revenue * 100).toFixed(0)
                    : "-";
                  
                  return (
                    <motion.tr
                      key={year.year}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold">{year.year}</td>
                      <td className="py-4 px-4 text-right text-green-400 font-mono">
                        {formatUSD(year.revenue)}
                      </td>
                      <td className={`py-4 px-4 text-right font-mono ${year.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatUSD(year.profit)}
                      </td>
                      <td className="py-4 px-4 text-right text-cyan-400 font-mono">
                        {year.users.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {growth !== "-" && (
                          <span className="inline-flex items-center gap-1 text-yellow-400">
                            <TrendingUp className="w-4 h-4" />
                            {growth}%
                          </span>
                        )}
                        {growth === "-" && <span className="text-gray-500">-</span>}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Break-even Notice */}
          <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400">
              <Target className="w-5 h-5" />
              <span className="font-semibold">Break-even dự kiến: Q2 2025</span>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* ROI Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <GlowCard color="cyan" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">ROI Calculator - Tính Lợi Tức Đầu Tư</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Số Tiền Đầu Tư (VNĐ)
                </label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  className="bg-white/5 border-white/10"
                  placeholder="100,000,000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu: 50,000,000 VNĐ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Thời Gian Đầu Tư (Năm)
                </label>
                <div className="flex gap-2">
                  {[3, 5, 7].map((years) => (
                    <Button
                      key={years}
                      variant={investmentYears === years ? "default" : "outline"}
                      onClick={() => setInvestmentYears(years)}
                      className={investmentYears === years 
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500" 
                        : "border-white/10"
                      }
                    >
                      {years} năm
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Side */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="text-sm text-gray-400 mb-1">Tổng Giá Trị Nhận Lại</div>
                <div className="text-3xl font-bold text-cyan-400">{formatCurrency(roi.totalReturn)}</div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="text-sm text-gray-400 mb-1">Lợi Nhuận</div>
                <div className="text-3xl font-bold text-green-400">{formatCurrency(roi.profit)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Tỷ Suất/Năm</div>
                  <div className="text-xl font-bold text-yellow-400">{roi.annualReturn}%</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Hệ Số Nhân</div>
                  <div className="text-xl font-bold text-orange-400">{roi.multiplier}x</div>
                </div>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Use of Funds */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <GlowCard color="blue" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Phân Bổ Vốn Đầu Tư</h2>
          </div>

          <div className="space-y-4">
            {useOfFunds.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-gray-400">{item.percentage}% • {formatCurrency(item.amount)}</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${item.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Tổng Vốn Huy Động</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                50 tỷ VNĐ
              </span>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Download Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <GlowCard color="yellow" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">Tài Liệu Tài Chính</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col items-start p-4 border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5"
            >
              <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
              <span className="font-semibold mb-1">Financial Model</span>
              <span className="text-xs text-gray-400">Excel 5-year projection</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col items-start p-4 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5"
            >
              <Calendar className="w-6 h-6 text-cyan-400 mb-2" />
              <span className="font-semibold mb-1">Investment Deck</span>
              <span className="text-xs text-gray-400">PDF presentation</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col items-start p-4 border-white/10 hover:border-green-500/50 hover:bg-green-500/5"
            >
              <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
              <span className="font-semibold mb-1">Due Diligence Pack</span>
              <span className="text-xs text-gray-400">Complete documentation</span>
            </Button>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default InvestmentFinancials;

import { Gem, Sparkles, Tag } from "lucide-react";

export const VoucherShopScreen = () => {
  const vouchers = [
    { name: "Bronze Voucher", spa: 100, discount: "10%", color: "from-orange-600 to-orange-800", available: true },
    { name: "Silver Voucher", spa: 200, discount: "20%", color: "from-gray-400 to-gray-600", available: true },
    { name: "Gold Voucher", spa: 500, discount: "35%", color: "from-yellow-400 to-yellow-600", available: false },
  ];

  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-bold font-display flex items-center gap-2">
          <Gem className="w-4 h-4 text-neon-cyan" />
          Voucher Shop
        </h3>
        <div className="px-3 py-1.5 bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 rounded-full">
          <span className="text-neon-green text-xs font-bold">💎 500 SPA</span>
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {vouchers.map((voucher, index) => (
          <div
            key={index}
            className={`glass-panel rounded-xl p-3 border ${
              voucher.available ? 'border-neon-cyan/30' : 'border-muted/20 opacity-60'
            }`}
          >
            <div className={`h-20 rounded-lg bg-gradient-to-br ${voucher.color} p-3 flex flex-col justify-between mb-2 relative overflow-hidden`}>
              {/* Discount Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full">
                <span className="text-dark-bg text-xs font-bold">{voucher.discount} OFF</span>
              </div>
              
              <div>
                <Sparkles className="w-4 h-4 text-white mb-1" />
                <p className="text-white text-sm font-bold">{voucher.name}</p>
              </div>
              
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-white" />
                <span className="text-white text-xs">Available at 15+ clubs</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Gem className="w-4 h-4 text-neon-cyan" />
                <span className="text-neon-cyan text-sm font-bold">{voucher.spa} SPA</span>
              </div>
              <button
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
                  voucher.available
                    ? 'bg-gradient-to-r from-primary to-neon-cyan text-white'
                    : 'bg-muted/20 text-muted-foreground cursor-not-allowed'
                }`}
                disabled={!voucher.available}
              >
                {voucher.available ? 'Đổi Ngay' : 'Không đủ SPA'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="glass-panel rounded-xl p-3 border border-neon-green/20">
        <p className="text-center text-foreground text-xs">
          <Sparkles className="w-3 h-3 inline mr-1 text-neon-green" />
          Tích SPA từ mỗi trận đấu để đổi voucher thật!
        </p>
      </div>
    </div>
  );
};

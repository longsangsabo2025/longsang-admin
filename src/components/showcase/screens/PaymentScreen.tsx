import { CreditCard, Lock } from "lucide-react";

export const PaymentScreen = () => {
  return (
    <div className="h-full w-full p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-white text-sm font-semibold mb-1">Payment</h3>
        <p className="text-white/50 text-xs">Complete your booking</p>
      </div>
      
      {/* Amount */}
      <div className="bg-gradient-to-br from-app-blue/20 to-app-light-blue/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
        <p className="text-white/60 text-xs mb-1">Total Amount</p>
        <p className="text-white text-2xl font-bold">$249.00</p>
      </div>
      
      {/* Card mockup */}
      <div className="bg-gradient-to-br from-mesh-purple to-mesh-pink rounded-xl p-4 aspect-[1.6/1] flex flex-col justify-between shadow-phone">
        <div className="flex justify-between items-start">
          <CreditCard className="w-6 h-6 text-white/80" />
          <p className="text-white/80 text-xs font-medium">VISA</p>
        </div>
        
        <div>
          <p className="text-white text-xs tracking-wider mb-2">•••• •••• •••• 4242</p>
          <div className="flex justify-between">
            <div>
              <p className="text-white/60 text-[9px]">CARD HOLDER</p>
              <p className="text-white text-xs font-medium">John Doe</p>
            </div>
            <div>
              <p className="text-white/60 text-[9px]">EXPIRES</p>
              <p className="text-white text-xs font-medium">12/25</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pay button */}
      <div className="mt-auto">
        <button className="w-full h-12 bg-gradient-to-r from-app-blue to-app-light-blue rounded-full text-white font-semibold flex items-center justify-center gap-2 shadow-glow">
          <Lock className="w-4 h-4" />
          Pay Securely
        </button>
        <p className="text-white/40 text-[10px] text-center mt-2 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Secured by 256-bit encryption
        </p>
      </div>
    </div>
  );
};

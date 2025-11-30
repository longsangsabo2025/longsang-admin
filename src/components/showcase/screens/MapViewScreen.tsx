import { MapPin, Navigation } from "lucide-react";

export const MapViewScreen = () => {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-app-blue/30 via-app-navy/40 to-app-dark/50">
        {/* Grid to simulate map */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-px bg-white/20"
              style={{ top: `${i * 10}%` }}
            />
          ))}
          {[...Array(10)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-px bg-white/20"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>
        
        {/* Location pins */}
        <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
          <MapPin className="w-6 h-6 text-app-light-blue fill-app-light-blue animate-bounce" />
        </div>
        
        <div className="absolute top-1/2 right-1/4 flex flex-col items-center">
          <MapPin className="w-5 h-5 text-mesh-pink fill-mesh-pink" />
        </div>
        
        <div className="absolute bottom-1/3 left-1/2 flex flex-col items-center">
          <MapPin className="w-5 h-5 text-mesh-cyan fill-mesh-cyan" />
        </div>
      </div>
      
      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md rounded-t-3xl p-4 border-t border-white/20">
        <div className="w-12 h-1 bg-white/40 rounded-full mx-auto mb-3" />
        <h3 className="text-white font-semibold text-sm mb-1">San Francisco, CA</h3>
        <p className="text-white/60 text-xs mb-3">15 locations nearby</p>
        <button className="w-full h-10 bg-app-light-blue rounded-full text-white text-sm font-medium flex items-center justify-center gap-2">
          <Navigation className="w-4 h-4" />
          Navigate
        </button>
      </div>
    </div>
  );
};

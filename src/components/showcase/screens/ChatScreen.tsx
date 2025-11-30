import { motion } from "framer-motion";

export const ChatScreen = () => {
  return (
    <div className="h-full w-full flex flex-col p-4 gap-3">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mesh-purple to-mesh-pink" />
        <div>
          <p className="text-white text-sm font-medium">Sarah Wilson</p>
          <p className="text-white/50 text-xs">Active now</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Received message */}
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 py-2 max-w-[70%]">
            <p className="text-white text-xs">Hey! Are you free this weekend?</p>
            <p className="text-white/40 text-[10px] mt-1">10:30 AM</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 py-2 max-w-[70%]">
            <p className="text-white text-xs">Want to grab coffee? ☕</p>
            <p className="text-white/40 text-[10px] mt-1">10:31 AM</p>
          </div>
        </div>
        
        {/* Sent messages */}
        <div className="flex gap-2 justify-end">
          <div className="bg-gradient-to-r from-app-blue to-app-light-blue rounded-2xl rounded-tr-sm px-3 py-2 max-w-[70%]">
            <p className="text-white text-xs">Sounds great!</p>
            <p className="text-white/70 text-[10px] mt-1">10:32 AM</p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <div className="bg-gradient-to-r from-app-blue to-app-light-blue rounded-2xl rounded-tr-sm px-3 py-2 max-w-[70%]">
            <p className="text-white text-xs">How about 2pm at the usual place?</p>
            <p className="text-white/70 text-[10px] mt-1">10:32 AM</p>
          </div>
        </div>
        
        {/* Typing indicator */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 py-2">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-white/50"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-white/50"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-white/50"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Input bar */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-9 bg-white/10 backdrop-blur-sm rounded-full px-4 flex items-center">
          <p className="text-white/40 text-xs">Type a message...</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-app-blue to-app-light-blue flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-full" />
        </div>
      </div>
    </div>
  );
};

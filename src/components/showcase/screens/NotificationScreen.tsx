import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export const NotificationScreen = () => {
  const notifications = [
    { icon: Heart, text: "Sarah liked your photo", time: "2m ago", color: "text-mesh-pink" },
    { icon: MessageCircle, text: "New message from Mike", time: "5m ago", color: "text-app-light-blue" },
    { icon: UserPlus, text: "Alex started following you", time: "1h ago", color: "text-mesh-purple" },
    { icon: Bell, text: "Reminder: Meeting at 3 PM", time: "2h ago", color: "text-mesh-cyan" },
  ];
  
  return (
    <div className="h-full w-full p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-semibold">Notifications</h3>
        <button className="text-app-light-blue text-xs font-medium">Mark all read</button>
      </div>
      
      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.map((notif, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-start gap-3 hover:bg-white/10 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 ${notif.color}`}>
              <notif.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs">{notif.text}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{notif.time}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-app-light-blue flex-shrink-0 mt-1" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

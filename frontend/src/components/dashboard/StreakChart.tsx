"use client";
import { motion } from "framer-motion";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const values = [40, 65, 55, 80, 70, 90, 45];
const maxVal = Math.max(...values);

export function StreakChart() {
  return (
    <div className="flex items-end gap-1 h-14">
      {days.map((day, i) => {
        const height = (values[i] / maxVal) * 100;
        const isToday = i === 5;
        return (
          <div key={day} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.4, ease: "easeOut" }}
              style={{
                height: `${height}%`,
                minHeight: "4px",
                transformOrigin: "bottom",
                background: isToday ? "#1a3a2a" : "#d1fae5",
                borderRadius: "2px",
                width: "100%",
              }}
            />
            <span style={{
              fontSize: "7px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: isToday ? "#1a3a2a" : "#9ca3af",
            }}>
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

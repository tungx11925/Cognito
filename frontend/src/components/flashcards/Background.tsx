"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export type BackgroundStyle = "nebula" | "geometry" | "default";

interface BackgroundProps {
  styleType: BackgroundStyle;
  dark: boolean;
}

export function Background({ styleType, dark }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (styleType === "default") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic definitions depending on styleType
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const stars: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
    }> = [];

    const meteors: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      thickness: number;
      opacity: number;
      active: boolean;
      life: number;
      maxLife: number;
    }> = [];

    const asteroids: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      ring: boolean;
    }> = [];

    const resetMeteor = (index: number) => {
      const startSide = Math.random() > 0.5;
      const mx = startSide ? Math.random() * width : width + 50;
      const my = startSide ? -50 : Math.random() * height * 0.5;
      
      const speed = 8 + Math.random() * 8;
      const angle = Math.PI * (0.7 + Math.random() * 0.1); 
      
      meteors[index] = {
        x: mx,
        y: my,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 50 + Math.random() * 60,
        thickness: 1.0 + Math.random() * 1.5,
        opacity: 0,
        active: false,
        life: 0,
        maxLife: 25 + Math.random() * 30
      };
    };

    if (styleType === "geometry") {
      const particleCount = Math.min(60, Math.floor((width * height) / 20000));
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        });
      }
    } else if (styleType === "nebula") {
      const starCount = Math.min(180, Math.floor((width * height) / 6000));
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.4,
          angle: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.02,
        });
      }

      for (let i = 0; i < 6; i++) {
        resetMeteor(i);
      }

      const asteroidCount = 9;
      const astColors = dark 
        ? [
            "rgba(16, 185, 129, 0.25)", // emerald
            "rgba(6, 182, 212, 0.25)",  // cyan
            "rgba(139, 92, 246, 0.2)",  // purple
            "rgba(245, 158, 11, 0.2)",  // amber
            "rgba(236, 72, 153, 0.2)",  // pink
            "rgba(59, 130, 246, 0.25)", // blue
            "rgba(20, 184, 166, 0.25)"  // teal
          ]
        : [
            "rgba(26, 46, 28, 0.12)",   // dark green
            "rgba(212, 185, 6, 0.15)",  // gold
            "rgba(92, 143, 246, 0.15)", // soft blue
            "rgba(16, 185, 129, 0.15)", // light emerald
            "rgba(217, 70, 239, 0.15)", // fuchsia
            "rgba(249, 115, 22, 0.15)"  // orange
          ];
      for (let i = 0; i < asteroidCount; i++) {
        asteroids.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          radius: Math.random() * 7 + 3,
          color: astColors[i % astColors.length],
          ring: Math.random() > 0.35
        });
      }
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colorParticle = dark ? "rgba(16, 185, 129, 0.4)" : "rgba(26, 46, 28, 0.25)";
    const colorLine = dark ? "rgba(16, 185, 129, 0.08)" : "rgba(26, 46, 28, 0.05)";

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (styleType === "geometry") {
        // Draw lines
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
              ctx.beginPath();
              ctx.strokeStyle = colorLine;
              ctx.lineWidth = (1 - dist / 120) * 0.8;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw and update particles
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = colorParticle;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        });
      } else if (styleType === "nebula") {
        // 1. Draw Stars
        stars.forEach(s => {
          s.angle += s.speed;
          const opacity = 0.3 + (Math.sin(s.angle) + 1) * 0.35;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(26, 46, 28, ${opacity})`;
          ctx.fill();
        });

        // 2. Draw Asteroids
        asteroids.forEach(a => {
          a.x += a.vx;
          a.y += a.vy;

          if (a.x < -20) a.x = width + 20;
          if (a.x > width + 20) a.x = -20;
          if (a.y < -20) a.y = height + 20;
          if (a.y > height + 20) a.y = -20;

          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = a.color.replace(/[\d\.]+\)$/, "0.03)");
          ctx.fill();

          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
          ctx.fillStyle = a.color;
          ctx.fill();

          if (a.ring) {
            ctx.beginPath();
            ctx.ellipse(a.x, a.y, a.radius * 1.8, a.radius * 0.4, Math.PI / 6, 0, Math.PI * 2);
            ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 46, 28, 0.08)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });

        // 3. Draw & Update Meteors
        for (let i = 0; i < meteors.length; i++) {
          const m = meteors[i];
          if (!m.active) {
            if (Math.random() < 0.012) {
              m.active = true;
            }
            continue;
          }

          m.life++;
          if (m.life < 8) {
            m.opacity = m.life / 8;
          } else if (m.life > m.maxLife - 8) {
            m.opacity = (m.maxLife - m.life) / 8;
          } else {
            m.opacity = 1;
          }

          const gradient = ctx.createLinearGradient(
            m.x, m.y, 
            m.x - m.vx * (m.length / 12), m.y - m.vy * (m.length / 12)
          );
          const col = dark ? "16, 185, 129" : "26, 46, 28";
          gradient.addColorStop(0, `rgba(${col}, ${m.opacity * 0.65})`);
          gradient.addColorStop(1, `rgba(${col}, 0)`);

          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = m.thickness;
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * (m.length / 12), m.y - m.vy * (m.length / 12));
          ctx.stroke();

          m.x += m.vx;
          m.y += m.vy;

          if (m.life >= m.maxLife || m.x < -100 || m.y > height + 100) {
            resetMeteor(i);
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [styleType, dark]);

  if (styleType === "default") {
    return null;
  }

  if (styleType === "geometry") {
    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: 0.8, zIndex: -10 }}
      />
    );
  }

  // Nebula background
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      {/* Dynamic light gradient */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: dark
            ? "radial-gradient(circle at 50% 50%, #0c2014 0%, #080d0a 100%)"
            : "radial-gradient(circle at 50% 50%, #fdfcf9 0%, #ebe8e0 100%)",
        }}
      />

      {/* Blob 1 */}
      <motion.div
        animate={{
          x: [0, 80, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-screen"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
        }}
      />

      {/* Blob 2 */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 60, -90, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[15%] right-[15%] w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-screen"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(212,185,6,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Blob 3 */}
      <motion.div
        animate={{
          x: [0, 50, -40, 0],
          y: [0, 80, -60, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full blur-[90px] pointer-events-none opacity-30 mix-blend-multiply dark:mix-blend-screen"
        style={{
          background: dark
            ? "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(92,143,246,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Canvas for cosmic elements (stars, meteors, asteroids) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: 0.85 }}
      />
    </div>
  );
}

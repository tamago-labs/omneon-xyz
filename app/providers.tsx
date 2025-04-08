"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';

import AOS from 'aos';
import 'aos/dist/aos.css';

import Loading from "@/components/Loading";

export function Providers({ children }: any) {

    const canvasRef = useRef(null);
 
    useEffect(() => {
        AOS.init({
            once: true,
        });
    }, []);
 

    // Animated background effect
    useEffect(() => {
        const canvas: any = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any = [];
        const particleCount = 50;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                color: `rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 100 + 100)}, 255, ${Math.random() * 0.5 + 0.2})`,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 - 0.5
            });
        }

        // Animation function
        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle: any) => {
                // Move particles
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
            });

            // Draw connections between particles
            particles.forEach((particle: any, index: number) => {
                for (let i = index + 1; i < particles.length; i++) {
                    const dx = particle.x - particles[i].x;
                    const dy = particle.y - particles[i].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(150, 150, 255, ${0.2 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(particles[i].x, particles[i].y);
                        ctx.stroke();
                    }
                }
            });
        }

        animate();

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            {/* Animated background canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* Floating objects */}
            {/* <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 opacity-10"
                    animate={{
                        x: [0, 100, 50, 0],
                        y: [0, 50, 100, 0],
                        scale: [1, 1.1, 0.9, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    style={{ top: '10%', left: '10%' }}
                />

                <motion.div
                    className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 opacity-10"
                    animate={{
                        x: [0, -100, -50, 0],
                        y: [0, 100, 50, 0],
                        scale: [1, 0.9, 1.1, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    style={{ top: '30%', right: '10%' }}
                />

                <motion.div
                    className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 opacity-10"
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -100, -50, 0],
                        scale: [1, 1.2, 0.8, 1],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    style={{ bottom: '10%', left: '25%' }}
                />
            </div> */}
            {children}
        </div>
    );
}


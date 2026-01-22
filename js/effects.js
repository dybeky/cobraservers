// Base Effect Class
class BaseEffect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.animationId = null;
        this.mouse = { x: null, y: null, radius: 150 };
        this.lastMouseMove = 0;
        this.mouseThrottleMs = 16;
    }

    init() {
        this.createParticles();
    }

    createParticles() {
        // Override in subclasses
    }

    update() {
        // Override in subclasses
    }

    draw() {
        // Override in subclasses
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles = [];
    }

    getParticleCount() {
        return window.innerWidth < 768 ? 40 : 80;
    }

    isDarkTheme() {
        return !document.body.classList.contains('light-theme');
    }

    getParticleColor() {
        return this.isDarkTheme() ? '255, 255, 255' : '0, 0, 0';
    }

    setMouse(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }

    clearMouse() {
        this.mouse.x = null;
        this.mouse.y = null;
    }
}

// Web Effect (Connected Particles)
class WebEffect extends BaseEffect {
    createParticles() {
        this.particles = [];
        const count = this.getParticleCount();
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    particle.x -= Math.cos(angle) * force * 2;
                    particle.y -= Math.sin(angle) * force * 2;
                }
            }

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -1;
                particle.x = Math.max(0, Math.min(particle.x, this.canvas.width));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -1;
                particle.y = Math.max(0, Math.min(particle.y, this.canvas.height));
            }
        });
    }

    draw() {
        const color = this.getParticleColor();

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${particle.opacity})`;
            this.ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - distance / 120)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

// Matrix Effect (Falling Symbols)
class MatrixEffect extends BaseEffect {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        this.symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()アイウエオカキクケコサシスセソタチツテト';
    }

    createParticles() {
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }

    update() {
        // Drops fall down
        for (let i = 0; i < this.drops.length; i++) {
            this.drops[i]++;
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
        }
    }

    draw() {
        // Semi-transparent black for trail effect
        const isDark = this.isDarkTheme();
        this.ctx.fillStyle = isDark ? 'rgba(10, 10, 10, 0.05)' : 'rgba(245, 245, 245, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            const char = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            // Gradient effect - brighter at the head
            const headY = this.drops[i];
            const brightness = Math.min(1, Math.max(0.2, 1 - (headY - this.drops[i]) * 0.1));

            if (isDark) {
                this.ctx.fillStyle = `rgba(0, 255, 65, ${brightness * 0.8})`;
            } else {
                this.ctx.fillStyle = `rgba(0, 153, 38, ${brightness * 0.9})`;
            }

            this.ctx.fillText(char, x, y);
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Fireflies Effect (Glowing Points)
class FirefliesEffect extends BaseEffect {
    createParticles() {
        this.particles = [];
        const count = this.getParticleCount();
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 1,
                speedY: (Math.random() - 0.5) * 1,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.05 + 0.02,
                maxOpacity: Math.random() * 0.5 + 0.5
            });
        }
    }

    update() {
        this.particles.forEach(particle => {
            // Smooth wandering movement
            particle.speedX += (Math.random() - 0.5) * 0.1;
            particle.speedY += (Math.random() - 0.5) * 0.1;
            particle.speedX = Math.max(-1, Math.min(1, particle.speedX));
            particle.speedY = Math.max(-1, Math.min(1, particle.speedY));

            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Pulse animation
            particle.pulse += particle.pulseSpeed;

            // Mouse attraction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius * 0.5;
                    particle.x += (dx / distance) * force;
                    particle.y += (dy / distance) * force;
                }
            }

            // Wrap around edges
            if (particle.x < -20) particle.x = this.canvas.width + 20;
            if (particle.x > this.canvas.width + 20) particle.x = -20;
            if (particle.y < -20) particle.y = this.canvas.height + 20;
            if (particle.y > this.canvas.height + 20) particle.y = -20;
        });
    }

    draw() {
        const isDark = this.isDarkTheme();

        this.particles.forEach(particle => {
            const opacity = (Math.sin(particle.pulse) + 1) / 2 * particle.maxOpacity;
            const glowSize = particle.size + Math.sin(particle.pulse) * 2;

            // Outer glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, glowSize * 3
            );

            if (isDark) {
                gradient.addColorStop(0, `rgba(255, 215, 0, ${opacity})`);
                gradient.addColorStop(0.4, `rgba(255, 180, 0, ${opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            } else {
                gradient.addColorStop(0, `rgba(218, 165, 32, ${opacity})`);
                gradient.addColorStop(0.4, `rgba(184, 134, 11, ${opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(184, 134, 11, 0)');
            }

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, glowSize * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Core
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, glowSize * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = isDark ? `rgba(255, 255, 200, ${opacity})` : `rgba(255, 235, 150, ${opacity})`;
            this.ctx.fill();
        });
    }
}

// Snow Effect (Falling Snowflakes)
class SnowEffect extends BaseEffect {
    createParticles() {
        this.particles = [];
        const count = this.getParticleCount() * 1.5;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 1,
                speedY: Math.random() * 1 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.02 + 0.01,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    update() {
        this.particles.forEach(particle => {
            // Wobble movement
            particle.wobble += particle.wobbleSpeed;
            particle.x += Math.sin(particle.wobble) * 0.5 + particle.speedX;
            particle.y += particle.speedY;

            // Mouse repulsion
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    particle.x += (dx / distance) * force * 3;
                    particle.y += (dy / distance) * force * 3;
                }
            }

            // Reset when off screen
            if (particle.y > this.canvas.height + 10) {
                particle.y = -10;
                particle.x = Math.random() * this.canvas.width;
            }
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
        });
    }

    draw() {
        const isDark = this.isDarkTheme();

        this.particles.forEach(particle => {
            // Snowflake glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );

            if (isDark) {
                gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
                gradient.addColorStop(0.5, `rgba(200, 230, 255, ${particle.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
            } else {
                gradient.addColorStop(0, `rgba(0, 150, 200, ${particle.opacity})`);
                gradient.addColorStop(0.5, `rgba(0, 120, 180, ${particle.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(0, 100, 150, 0)');
            }

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Snowflake core
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${particle.opacity})` : `rgba(0, 180, 220, ${particle.opacity})`;
            this.ctx.fill();
        });
    }
}

// Stars Effect (Twinkling Stars + Shooting Stars)
class StarsEffect extends BaseEffect {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.shootingStars = [];
        this.shootingStarTimer = 0;
    }

    createParticles() {
        this.particles = [];
        this.shootingStars = [];
        const count = this.getParticleCount() * 1.5;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                baseOpacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    createShootingStar() {
        const startX = Math.random() * this.canvas.width;
        const startY = Math.random() * (this.canvas.height * 0.5);

        this.shootingStars.push({
            x: startX,
            y: startY,
            length: Math.random() * 80 + 40,
            speed: Math.random() * 10 + 8,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
            opacity: 1,
            trail: []
        });
    }

    update() {
        // Update twinkling stars
        this.particles.forEach(particle => {
            particle.twinkle += particle.twinkleSpeed;
        });

        // Random shooting star generation
        this.shootingStarTimer++;
        if (this.shootingStarTimer > 120 && Math.random() > 0.98) {
            this.createShootingStar();
            this.shootingStarTimer = 0;
        }

        // Update shooting stars
        this.shootingStars = this.shootingStars.filter(star => {
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.opacity -= 0.015;

            // Add trail point
            star.trail.push({ x: star.x, y: star.y, opacity: star.opacity });
            if (star.trail.length > 20) star.trail.shift();

            return star.opacity > 0 && star.x < this.canvas.width + 100 && star.y < this.canvas.height + 100;
        });
    }

    draw() {
        const isDark = this.isDarkTheme();

        // Draw twinkling stars
        this.particles.forEach(particle => {
            const opacity = particle.baseOpacity + Math.sin(particle.twinkle) * 0.3;
            const size = particle.size + Math.sin(particle.twinkle) * 0.5;

            // Star glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, size * 3
            );

            if (isDark) {
                gradient.addColorStop(0, `rgba(200, 180, 255, ${opacity})`);
                gradient.addColorStop(0.3, `rgba(168, 85, 247, ${opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
            } else {
                gradient.addColorStop(0, `rgba(147, 51, 234, ${opacity})`);
                gradient.addColorStop(0.3, `rgba(124, 58, 237, ${opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(109, 40, 217, 0)');
            }

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Star core
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(147, 51, 234, ${opacity})`;
            this.ctx.fill();
        });

        // Draw shooting stars
        this.shootingStars.forEach(star => {
            // Draw trail
            for (let i = 0; i < star.trail.length; i++) {
                const point = star.trail[i];
                const trailOpacity = (i / star.trail.length) * point.opacity * 0.5;
                const trailSize = (i / star.trail.length) * 3;

                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
                this.ctx.fillStyle = isDark
                    ? `rgba(200, 180, 255, ${trailOpacity})`
                    : `rgba(147, 51, 234, ${trailOpacity})`;
                this.ctx.fill();
            }

            // Draw head
            const headGradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, 8
            );

            if (isDark) {
                headGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
                headGradient.addColorStop(0.5, `rgba(200, 180, 255, ${star.opacity * 0.5})`);
                headGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
            } else {
                headGradient.addColorStop(0, `rgba(200, 180, 255, ${star.opacity})`);
                headGradient.addColorStop(0.5, `rgba(147, 51, 234, ${star.opacity * 0.5})`);
                headGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
            }

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = headGradient;
            this.ctx.fill();
        });
    }
}

// Export effect classes
window.EffectClasses = {
    BaseEffect,
    WebEffect,
    MatrixEffect,
    FirefliesEffect,
    SnowEffect,
    StarsEffect
};

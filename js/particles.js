// Particle System Controller
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentEffectName = 'stars';
        this.currentEffect = null;
        this.effects = {};
        this.transitioning = false;

        this.lastMouseMove = 0;
        this.mouseThrottleMs = 16;

        // Check for reduced motion preference
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.reducedMotion) {
            return;
        }

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.initEffects();
        this.loadSavedEffect();
        this.setupEventListeners();
        this.setupEffectSelector();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initEffects() {
        const { WebEffect, MatrixEffect, FirefliesEffect, SnowEffect, StarsEffect } = window.EffectClasses;

        this.effects = {
            web: new WebEffect(this.canvas, this.ctx),
            matrix: new MatrixEffect(this.canvas, this.ctx),
            fireflies: new FirefliesEffect(this.canvas, this.ctx),
            snow: new SnowEffect(this.canvas, this.ctx),
            stars: new StarsEffect(this.canvas, this.ctx)
        };
    }

    loadSavedEffect() {
        const savedEffect = localStorage.getItem('particleEffect');
        if (savedEffect && this.effects[savedEffect]) {
            this.setEffect(savedEffect, false);
        } else {
            this.setEffect('stars', false);
        }
    }

    setEffect(name, animate = true) {
        if (this.transitioning || !this.effects[name]) return;

        if (animate && this.currentEffect) {
            this.transitioning = true;

            // Switch background layer first (it will animate via CSS)
            this.switchBackgroundLayer(name);

            // Fade out canvas
            this.canvas.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            this.canvas.style.opacity = '0';

            // Wait then switch effect
            setTimeout(() => {
                // Destroy and switch effect
                if (this.currentEffect) {
                    this.currentEffect.destroy();
                }
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.currentEffectName = name;
                this.currentEffect = this.effects[name];
                this.currentEffect.init();
                this.currentEffect.animate();

                // Update body data attribute
                document.body.setAttribute('data-effect', name);
                localStorage.setItem('particleEffect', name);

                // Fade in canvas
                this.canvas.style.opacity = '1';

                setTimeout(() => {
                    this.canvas.style.transition = '';
                    this.transitioning = false;
                }, 500);
            }, 500);
        } else {
            this.switchEffect(name);
        }

        // Update active state in dropdown
        this.updateActiveOption(name);
    }

    switchEffect(name) {
        // Destroy current effect
        if (this.currentEffect) {
            this.currentEffect.destroy();
        }

        // Clear canvas for Matrix effect (it uses overlay clearing)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set new effect
        this.currentEffectName = name;
        this.currentEffect = this.effects[name];
        this.currentEffect.init();
        this.currentEffect.animate();

        // Update body data attribute
        document.body.setAttribute('data-effect', name);

        // Switch background layers
        this.switchBackgroundLayer(name);

        // Save to localStorage
        localStorage.setItem('particleEffect', name);
    }

    switchBackgroundLayer(name) {
        // Remove active from all bg layers
        const layers = document.querySelectorAll('.bg-layer');
        layers.forEach(layer => layer.classList.remove('active'));

        // Add active to the new layer
        const newLayer = document.querySelector(`.bg-${name}`);
        if (newLayer) {
            newLayer.classList.add('active');
        }
    }

    updateActiveOption(effectName) {
        const options = document.querySelectorAll('.effect-option');
        options.forEach(option => {
            if (option.dataset.effect === effectName) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // Resize handling
        window.addEventListener('resize', () => {
            this.resizeCanvas();

            // Reinitialize effects with new dimensions
            Object.values(this.effects).forEach(effect => {
                effect.canvas = this.canvas;
                effect.ctx = this.ctx;
            });

            // Recreate particles for current effect
            if (this.currentEffect) {
                this.currentEffect.createParticles();
            }
        });

        // Throttled mousemove
        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - this.lastMouseMove >= this.mouseThrottleMs) {
                if (this.currentEffect) {
                    this.currentEffect.setMouse(e.x, e.y);
                }
                this.lastMouseMove = now;
            }
        });

        window.addEventListener('mouseout', () => {
            if (this.currentEffect) {
                this.currentEffect.clearMouse();
            }
        });

        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                this.reducedMotion = true;
                if (this.currentEffect) {
                    this.currentEffect.destroy();
                }
            }
        });
    }

    setupEffectSelector() {
        const options = document.querySelectorAll('.effect-option');

        options.forEach(option => {
            option.addEventListener('click', () => {
                const effectName = option.dataset.effect;
                if (effectName && effectName !== this.currentEffectName) {
                    this.setEffect(effectName, true);
                }
            });
        });
    }
}

// Initialize particle system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem();
});

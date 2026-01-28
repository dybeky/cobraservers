// Particle System Controller
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentEffectName = 'stars';
        this.currentEffect = null;
        this.effects = {};
        this.transitioning = false;
        this.transitionTimeout = null; // For race condition fix

        this.lastMouseMove = 0;
        this.mouseThrottleMs = 16;

        // Bound handlers for cleanup
        this.boundHandlers = {
            resize: null,
            mousemove: null,
            mouseout: null,
            reducedMotion: null
        };

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

        // Cancel any pending transition (race condition fix)
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }

        if (animate && this.currentEffect) {
            this.transitioning = true;

            // Switch background layer first (it will animate via CSS)
            this.switchBackgroundLayer(name);

            // Fade out canvas
            this.canvas.style.transition = 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.canvas.style.opacity = '0';

            // Wait then switch effect
            this.transitionTimeout = setTimeout(() => {
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

                this.transitionTimeout = setTimeout(() => {
                    this.canvas.style.transition = '';
                    this.transitioning = false;
                    this.transitionTimeout = null;
                }, 300);
            }, 300);
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
        this.boundHandlers.resize = () => {
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
        };
        window.addEventListener('resize', this.boundHandlers.resize);

        // Throttled mousemove
        this.boundHandlers.mousemove = (e) => {
            const now = Date.now();
            if (now - this.lastMouseMove >= this.mouseThrottleMs) {
                if (this.currentEffect) {
                    this.currentEffect.setMouse(e.x, e.y);
                }
                this.lastMouseMove = now;
            }
        };
        window.addEventListener('mousemove', this.boundHandlers.mousemove);

        this.boundHandlers.mouseout = () => {
            if (this.currentEffect) {
                this.currentEffect.clearMouse();
            }
        };
        window.addEventListener('mouseout', this.boundHandlers.mouseout);

        // Listen for reduced motion changes
        this.boundHandlers.reducedMotion = (e) => {
            if (e.matches) {
                this.reducedMotion = true;
                if (this.currentEffect) {
                    this.currentEffect.destroy();
                }
            }
        };
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', this.boundHandlers.reducedMotion);
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

    // Destroy method for cleanup
    destroy() {
        // Cancel pending transitions
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }

        // Destroy current effect
        if (this.currentEffect) {
            this.currentEffect.destroy();
        }

        // Remove event listeners
        if (this.boundHandlers.resize) {
            window.removeEventListener('resize', this.boundHandlers.resize);
        }
        if (this.boundHandlers.mousemove) {
            window.removeEventListener('mousemove', this.boundHandlers.mousemove);
        }
        if (this.boundHandlers.mouseout) {
            window.removeEventListener('mouseout', this.boundHandlers.mouseout);
        }
        if (this.boundHandlers.reducedMotion) {
            window.matchMedia('(prefers-reduced-motion: reduce)').removeEventListener('change', this.boundHandlers.reducedMotion);
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize particle system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.particleSystem) {
            window.particleSystem.destroy();
        }
    });
});
